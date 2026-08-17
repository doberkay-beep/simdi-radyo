// ŞİMDİ toplayıcı worker — sürekli çalışır (serverless değil).
//
// Döngü: her POLL_INTERVAL_MS'de bir tüm aktif istasyonları yoklar,
// istekleri pencere içine yayar. raw_title bir öncekiyle AYNIYSA hiçbir şey
// yazmaz — plays'e yalnızca başlık gerçekten değişince yeni satır eklenir.
// Bu kural arşivin temizliğini belirler.

import "./env.mjs"; // .env.local'i (varsa) supabase.mjs'den ÖNCE yükle
import { probeIcy } from "./icy.mjs";
import { parseTitle } from "./parse.mjs";
import {
  loadActiveStations,
  loadNowPlaying,
  insertPlay,
  upsertNowPlaying,
  deactivateStation,
} from "./supabase.mjs";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 25_000;
const PROBE_TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS) || 8_000;
const MAX_FAILURES = Number(process.env.MAX_FAILURES) || 20;
// >0 ise worker bu süre kadar çalışıp çıkar (zamanlanmış çalışma, ör. GitHub
// Actions). 0/boş ise sonsuza kadar çalışır (yerel ya da Railway/Fly).
const RUN_DURATION_MS = Number(process.env.RUN_DURATION_MS) || 0;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString(), ...a);

// station_id → son yazılan raw_title
const lastRaw = new Map();
// station_id → üst üste başarısızlık sayısı
const failCount = new Map();

async function probeAndStore(station) {
  let res;
  try {
    res = await probeIcy(station.stream_url, { timeout: PROBE_TIMEOUT_MS });
  } catch (err) {
    res = { status: "dead", reason: err?.message || "hata" };
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
  if (lastRaw.get(station.id) === raw) return; // değişmediyse hiçbir şey yazma

  const parsed = parseTitle(raw);
  try {
    await insertPlay(station.id, parsed); // arşive ekle
    await upsertNowPlaying(station.id, parsed); // "şimdi çalan"ı güncelle
    lastRaw.set(station.id, raw);
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
  try {
    for (const row of await loadNowPlaying()) {
      if (row.raw_title) lastRaw.set(row.station_id, row.raw_title);
    }
    log(`${lastRaw.size} istasyonun son başlığı belleğe alındı.`);
  } catch (err) {
    log("! now_playing okunamadı (devam ediliyor):", err.message);
  }

  // Döngü. Her turda aktif listeyi tazeler (pasifleşenler düşer).
  const startedAt = Date.now();
  for (;;) {
    const start = Date.now();
    let stations = [];
    try {
      stations = await loadActiveStations();
    } catch (err) {
      log("! istasyon listesi alınamadı, tur atlanıyor:", err.message);
    }
    if (stations.length) await cycle(stations);

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
