// ŞİMDİ toplayıcı worker — sürekli çalışır (serverless değil).
//
// Döngü: her POLL_INTERVAL_MS'de bir tüm aktif istasyonları yoklar,
// istekleri pencere içine yayar. raw_title bir öncekiyle AYNIYSA hiçbir şey
// yazmaz — plays'e yalnızca başlık gerçekten değişince yeni satır eklenir.
// Bu kural arşivin temizliğini belirler.

import "./env.mjs"; // .env.local'i (varsa) supabase.mjs'den ÖNCE yükle
import { probeIcy } from "./icy.mjs";
import { parseTitle, normalizeTitle } from "./parse.mjs";
import {
  loadActiveStations,
  loadNowPlaying,
  insertPlay,
  upsertNowPlaying,
  loadAllStationsFull,
  deactivateStation,
} from "./supabase.mjs";

import { anlikKoy, anlikKaldir } from "./anlik.mjs";
import { arsivePlay, arsivNowPlaying, arsivIstasyonlar } from "./arsiv.mjs";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 10_000;
const PROBE_TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS) || 8_000;
const MAX_FAILURES = Number(process.env.MAX_FAILURES) || 20;
// Parça değişmese de yayın doğrulandığında now_playing.updated_at'i en fazla
// bu sıklıkta tazele → arayüzdeki "şu an çalıyor" tazeliği doğru olsun
// (uzun parça/aynı yayın "8 saat önce" gibi yanıltmasın). plays'e yazılmaz.
const FRESH_MS = Number(process.env.FRESH_MS) || 12 * 60_000;
// Aktif istasyon listesini bu sıklıkta yeniden çek (katalog günde birkaç kez değişir).
const STATIONS_REFRESH_MS = Number(process.env.STATIONS_REFRESH_MS) || 10 * 60_000;
// >0 ise worker bu süre kadar çalışıp çıkar (zamanlanmış çalışma, ör. GitHub
// Actions). 0/boş ise sonsuza kadar çalışır (yerel ya da Railway/Fly).
const RUN_DURATION_MS = Number(process.env.RUN_DURATION_MS) || 0;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString(), ...a);

// station_id → son yazılan raw_title
const lastRaw = new Map();
// main döngüsünün son aktif istasyon listesi (SomaFM turu buradan okur).
let guncelIstasyonlar = [];
// station_id → now_playing'e en son yazma zamanı (tazelik kısması için)
const lastWrite = new Map();
// station_id → üst üste başarısızlık sayısı
const failCount = new Map();
// station_id → Map(başlık → son arşive yazılma zamanı). Bazı yayınlar başlığı
// şarkı ↔ slogan ↔ program adı arasında gidip getiriyor (A-B-A); her dönüşte
// aynı parça plays'e yeniden yazılıyordu (5 Eki ölçümü: saatte ~880 satır, %16).
// Aynı başlık TEKRAR_MS içinde zaten arşivlendiyse yeni satır açılmaz.
const recent = new Map();
const TEKRAR_MS = Number(process.env.TEKRAR_MS) || 20 * 60_000;
// Donmuş başlık (27 Eki): bazı yayınlar günlerce aynı başlığı gönderiyor (Radyo Alaturka
// 3 gün aynı şarkı, Cool Fahrenheit yalnız slogan). Aynı başlık DONMUS_MS'den uzun
// sürerse "şu an çalıyor" gösterilmez: anlık kopyadan çıkar, updated_at tazelenmez.
// Başlık değişince kendiliğinden geri gelir. Uzun klasik eserler de bu süreyi aşınca gizlenir.
const DONMUS_MS = Number(process.env.DONMUS_MS) || 30 * 60_000;
// Uzun yayın işaretli başlıklar (DJ seti, bölüm, program) için süre 3 saat: "Solar Power Sessions 957",
// "This Is Freestyle Episode 260", "Budots Remix Nonstop" gibi başlıklar doğru ama saatlerce sürer (27 Eki ölçümü).
const DONMUS_UZUN_MS = Number(process.env.DONMUS_UZUN_MS) || 3 * 3600_000;
const UZUN_YAYIN = /\b(episode|ep\.?\s?\d+|sessions?|mix|mixtape|nonstop|non-stop|presents|show|podcast|live set|radio show|bölüm|program)\b/i;
const ilkGorulme = new Map(); // station_id → bu başlığın ilk görüldüğü an
const donmus = new Set(); // şu an gizlenen station_id'ler
function yeniBaslik(station, now) {
  ilkGorulme.set(station.id, now);
  if (donmus.delete(station.id)) log(`çözüldü: ${station.slug}`);
}
function yakindaYazildi(stationId, clean, now) {
  const m = recent.get(stationId);
  if (!m) return false;
  for (const [t, ts] of m) if (now - ts > TEKRAR_MS) m.delete(t);
  return m.has(clean);
}
function yazildiIsaretle(stationId, clean, now) {
  let m = recent.get(stationId);
  if (!m) recent.set(stationId, (m = new Map()));
  m.set(clean, now);
}

// Hız sınırı (27 Eki): bazı sağlayıcılar 10 sn'de bir bağlanmamıza "429 Too Many Requests"
// diyor (Absolut Relax). 429 gelince o istasyon BEKLE_429_MS boyunca yoklanmaz ve bu
// başarısızlık sayılmaz (pasifleştirmeye götürmesin).
const BEKLE_429_MS = Number(process.env.BEKLE_429_MS) || 10 * 60_000;
const bekle = new Map(); // station_id → bu zamana kadar yoklama

// SomaFM (27 Eki): yayınlarına sık bağlanmak zaman aşımına düşüyordu. Şarkı adları
// SomaFM'in herkese açık kanal listesinden (channels.json) dakikada tek istekle alınır;
// somafm.com yayınları ICY ile yoklanmaz. Dinleme yine doğrudan yayından olur.
const SOMA_URL = "https://somafm.com/channels.json";
const SOMA_MS = Number(process.env.SOMA_MS) || 60_000;
function somaKanal(streamUrl) {
  try {
    const u = new URL(streamUrl);
    if (!/(^|\.)somafm\.com$/i.test(u.hostname)) return null;
    return u.pathname.replace(/^\//, "").split(/[-.]/)[0] || null; // "/groovesalad-128-mp3" → "groovesalad"
  } catch {
    return null;
  }
}
async function somaTur(stations) {
  const soma = stations.map((s) => [s, somaKanal(s.stream_url)]).filter(([, k]) => k);
  if (!soma.length) return;
  let kanallar;
  try {
    const r = await fetch(SOMA_URL, {
      headers: { "User-Agent": "nowby/1.0 (+https://nowby.co)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`http-${r.status}`);
    kanallar = new Map(((await r.json()).channels || []).map((c) => [c.id, c.lastPlaying]));
  } catch (err) {
    log("! SomaFM kanal listesi alınamadı:", err.message);
    return;
  }
  for (const [station, kanal] of soma) {
    const title = kanallar.get(kanal);
    await isle(station, title ? { status: "ok", title } : { status: "none", reason: "soma-kanal-yok" });
  }
}

async function probeAndStore(station) {
  if ((bekle.get(station.id) || 0) > Date.now()) return;
  let res;
  try {
    res = await probeIcy(station.stream_url, { timeout: PROBE_TIMEOUT_MS });
  } catch (err) {
    res = { status: "dead", reason: err?.message || "hata" };
  }
  await isle(station, res);
}

// Yoklama sonucunu işler (ICY ya da SomaFM listesi).
async function isle(station, res) {
  if (res.reason === "http-429") {
    if (!bekle.has(station.id) || bekle.get(station.id) <= Date.now()) {
      log(`429: ${station.slug} — ${Math.round(BEKLE_429_MS / 60_000)} dk beklenecek`);
    }
    bekle.set(station.id, Date.now() + BEKLE_429_MS);
    return;
  }

  // Başarısızlık: bağlanılamadı ya da kullanılabilir metadata yok.
  if (res.status !== "ok" || !res.title) {
    const c = (failCount.get(station.id) || 0) + 1;
    failCount.set(station.id, c);
    if (c >= MAX_FAILURES) {
      try {
        await deactivateStation(station.id);
        log(`PASİF: ${station.slug} (${MAX_FAILURES} kez üst üste başarısız)`);
      } catch (err) {
        log(`! ${station.slug} pasifleştirilemedi:`, err.message);
      }
      failCount.delete(station.id);
      lastRaw.delete(station.id);
    }
    return;
  }

  // Başarı → sayaç sıfırlanır.
  failCount.set(station.id, 0);

  const raw = res.title.trim();
  if (!raw) return; // boş başlık yazma
  // Reklam/istasyon adı/URL gibi çöpü ve iki kez yapışmış başlığı temizle.
  const clean = normalizeTitle(raw, station.name);
  if (!clean) return; // anlamsız başlık — yaz(ma), önceki iyi başlık kalsın

  const now = Date.now();

  // Başlık değişmediyse: arşive yazma. Ama yayın DOĞRULANDIĞI için, arayüzün
  // tazelik göstergesi doğru olsun diye updated_at'i arada bir tazele (kısmalı).
  if (lastRaw.get(station.id) === clean) {
    if (!ilkGorulme.has(station.id)) ilkGorulme.set(station.id, now);
    if (now - ilkGorulme.get(station.id) > (UZUN_YAYIN.test(clean) ? DONMUS_UZUN_MS : DONMUS_MS)) {
      if (!donmus.has(station.id)) {
        donmus.add(station.id);
        anlikKaldir(station.slug);
        log(`donmuş başlık: ${station.slug} (${Math.round(DONMUS_MS / 60_000)} dk+ aynı) — gizlendi`);
      }
      return;
    }
    // Anlık kopyada tazelik her yoklamada güncellenir (veritabanına yük yok).
    anlikKoy(station.slug, parseTitle(clean));
    if (now - (lastWrite.get(station.id) || 0) < FRESH_MS) return;
    try {
      await upsertNowPlaying(station.id, parseTitle(clean)); // yalnız updated_at tazelenir
      lastWrite.set(station.id, now);
    } catch (err) {
      log(`! ${station.slug} tazelenemedi:`, err.message);
    }
    return;
  }

  const parsed = parseTitle(clean);
  // Gidip-gelen başlık: yakın zamanda arşivlenmiş parça geri döndüyse arşive
  // yeniden yazma; yalnız "şimdi çalan"ı güncelle.
  anlikKoy(station.slug, parsed);
  if (yakindaYazildi(station.id, clean, now)) {
    try {
      await upsertNowPlaying(station.id, parsed);
      arsivNowPlaying(station.id, parsed);
      lastRaw.set(station.id, clean);
      yeniBaslik(station, now);
      lastWrite.set(station.id, now);
    } catch (err) {
      log(`! ${station.slug} tazelenemedi:`, err.message);
    }
    return;
  }
  try {
    const satir = await insertPlay(station.id, parsed); // arşive ekle
    await upsertNowPlaying(station.id, parsed); // "şimdi çalan"ı güncelle
    arsivePlay(satir, station.id, parsed); // Hetzner arşivine aynısı (beklenmez)
    arsivNowPlaying(station.id, parsed);
    lastRaw.set(station.id, clean);
    yeniBaslik(station, now);
    lastWrite.set(station.id, now);
    yazildiIsaretle(station.id, clean, now);
    log(`♪ ${station.slug}: ${parsed.artist} — ${parsed.title}`);
  } catch (err) {
    // Yazma hatasında lastRaw güncellenmez ki sonraki turda tekrar denensin.
    log(`! ${station.slug} yazılamadı:`, err.message);
  }
}

// Bir tur: istasyonları pencereye yayarak yoklar.
async function cycle(stations) {
  const n = stations.length;
  if (n === 0) return;
  // İstekleri pencerenin ~%80'ine yay, sonuna tampon bırak.
  const window = Math.max(1, POLL_INTERVAL_MS - 5_000);
  const gap = Math.floor(window / n);
  const tasks = stations.map((s, i) => delay(i * gap).then(() => probeAndStore(s)));
  await Promise.allSettled(tasks);
}

async function main() {
  log(`Toplayıcı başladı. Aralık ${POLL_INTERVAL_MS}ms, zaman aşımı ${PROBE_TIMEOUT_MS}ms.`);

  // Yeniden başlatmada tekrar yazmamak için son başlıkları belleğe al.
  let ilkSatirlar = [];
  try {
    ilkSatirlar = await loadNowPlaying();
    for (const row of ilkSatirlar) {
      if (row.raw_title) lastRaw.set(row.station_id, row.raw_title);
    }
    log(`${lastRaw.size} istasyonun son başlığı belleğe alındı.`);
  } catch (err) {
    log("! now_playing okunamadı (devam ediliyor):", err.message);
  }

  // Döngü. Aktif listeyi STATIONS_REFRESH_MS'de bir tazeler (pasifleşenler
  // düşer, yeni eklenenler katılır). Her turda çekmek Supabase egress'inin
  // yarısını yiyordu (422 satır × 25 sn ≈ 230 MB/gün).
  const startedAt = Date.now();
  // SomaFM döngüsü ana turdan bağımsız, dakikada bir.
  (async () => {
    for (;;) {
      await delay(SOMA_MS);
      await somaTur(guncelIstasyonlar).catch((err) => log("! SomaFM turu:", err.message));
    }
  })();
  let stations = [];
  let stationsAt = 0;
  for (;;) {
    const start = Date.now();
    if (!stations.length || start - stationsAt >= STATIONS_REFRESH_MS) {
      try {
        const ilkTur = !stations.length;
        stations = await loadActiveStations();
        stationsAt = start;
        // Hetzner arşivindeki istasyon kopyasını eşitle (10 dakikada bir).
        loadAllStationsFull().then(arsivIstasyonlar).catch((err) => log("! istasyon eşitleme:", err.message));
        // İlk listede anlık kopyayı veritabanındaki son (temizlenmiş) başlıklarla doldur.
        if (ilkTur) {
          const istasyon = new Map(stations.map((s) => [s.id, s]));
          for (const row of ilkSatirlar) {
            const st = istasyon.get(row.station_id);
            const temiz = st && row.raw_title ? normalizeTitle(row.raw_title, st.name) : "";
            if (temiz) anlikKoy(st.slug, parseTitle(temiz), row.updated_at);
          }
        }
      } catch (err) {
        log("! istasyon listesi alınamadı:", err.message, stations.length ? "(eski liste kullanılıyor)" : "(tur atlanıyor)");
      }
    }
    guncelIstasyonlar = stations;
    if (stations.length) await cycle(stations.filter((s) => !somaKanal(s.stream_url)));

    // Zamanlanmış çalışmada süre dolduysa temiz çık.
    if (RUN_DURATION_MS && Date.now() - startedAt >= RUN_DURATION_MS) {
      log("Süre doldu, çıkılıyor (zamanlanmış çalışma).");
      return;
    }
    const elapsed = Date.now() - start;
    await delay(Math.max(0, POLL_INTERVAL_MS - elapsed));
  }
}

// Düzgün kapanış.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    log(`${sig} alındı, kapanıyor.`);
    process.exit(0);
  });
}

main().catch((err) => {
  log("ÖLÜMCÜL:", err.message);
  process.exit(1);
});
