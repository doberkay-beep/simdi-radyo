// Türkçe tür taraması (keşif scripti, atılabilir).
// Radio Browser'dan tür etiketli TR istasyonlarını çeker, ICY metadata için
// yoklar, çalışanları bir rapora yazar. Çıkanlardan iyi olanları elle katalog
// (collector/seed.json) içine ekleriz.
//
// Çalıştır (repo kökünden):  node probe/genre-probe.mjs
// Çıktı: probe/tur-rapor.csv

import dns from "node:dns/promises";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const UA = "Simdi/0.1";
const here = dirname(fileURLToPath(import.meta.url));

// Tür → Radio Browser etiket çeşitleri (Türkçe + İngilizce).
const GENRES = {
  "tsm": ["türk sanat müziği", "sanat müziği", "tsm", "turkish art music"],
  "türkü": ["türkü", "turkish folk", "halk müziği", "folk"],
  "arabesk": ["arabesk"],
  "türkçe pop": ["türkçe pop", "turkish pop"],
  "pop": ["pop"],
  "rock": ["rock", "türk rock", "turkish rock"],
  "metal": ["metal"],
  "caz": ["caz", "jazz"],
  "klasik": ["klasik", "classical", "classic"],
  "elektronik": ["elektronik", "electronic", "house", "techno"],
  "alternatif": ["alternatif", "alternative", "indie"],
  "slow / nostalji": ["slow", "nostalji", "oldies"],
};

const PER_TAG = 6; // her etiket için en çok kaç istasyon
const TOP_LIMIT = 120; // en çok oy alan TR istasyonu (etiketsiz büyükleri yakala)
const BATCH = 12; // aynı anda kaç yoklama (daha hızlı)
const TIMEOUT = 5000; // her istasyon en çok bu kadar (mutlak sınır)

// İsimle özellikle aranacak aileler (etikette çıkmayabiliyorlar).
const WANT_NAMES = [
  "pal", "power", "kral", "slow türk", "slow turk", "number", "virgin",
  "fenomen", "trt", "best fm", "show radyo", "radyo viva", "radyo d",
  "süper fm", "metro fm", "joy türk", "kiss fm",
];

async function resolveServers() {
  const hosts = new Set();
  try {
    for (const ip of await dns.resolve4("all.api.radio-browser.info")) {
      try {
        for (const n of await dns.reverse(ip)) hosts.add(n);
      } catch {
        hosts.add(ip);
      }
    }
  } catch {
    hosts.add("all.api.radio-browser.info");
  }
  const arr = [...hosts];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Radio Browser'a bir sorgu at, ilk çalışan sunucudan diziyi döndür.
async function rbGet(servers, path) {
  for (const host of servers) {
    try {
      const res = await fetch(`https://${host}${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) return data;
    } catch {
      // sıradaki sunucu
    }
  }
  return [];
}

function fetchByTag(servers, tag) {
  return rbGet(
    servers,
    `/json/stations/search?countrycode=TR&tag=${encodeURIComponent(tag)}` +
      `&hidebroken=true&order=clickcount&reverse=true&limit=${PER_TAG}`,
  );
}

// En çok oy alan TR istasyonları (etikete güvenmeden büyükleri de yakala).
function fetchTop(servers) {
  return rbGet(
    servers,
    `/json/stations/bycountrycodeexact/TR?hidebroken=true` +
      `&order=votes&reverse=true&limit=${TOP_LIMIT}`,
  );
}

// İsimle ara (Pal, Power, Kral gibi aileler etikette çıkmıyor).
function fetchByName(servers, name) {
  return rbGet(
    servers,
    `/json/stations/byname/${encodeURIComponent(name)}` +
      `?hidebroken=true&order=votes&reverse=true&limit=10`,
  );
}

const JUNK = ["www.", ".com", "reklam", "canlı yayın"];
function classifyOne(name, res) {
  if (res.status === "dead") return "dead";
  if (res.status === "none") return "none";
  const t = (res.title || "").trim();
  if (!t) return "static";
  const low = t.toLocaleLowerCase("tr");
  if (JUNK.some((p) => low.includes(p)) || low.includes(name.toLocaleLowerCase("tr")))
    return "junk";
  return /\S+\s-\s\S+/.test(t) ? "good" : "static";
}

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  console.log("Radio Browser sunucuları çözülüyor...");
  const servers = await resolveServers();

  // Tür etiketlerine göre istasyonları topla, uuid'e göre tekilleştir.
  const byUuid = new Map(); // uuid -> { station, genre }
  const add = (s, genre) => {
    if (!s.stationuuid || !(s.url_resolved || s.url)) return;
    if (s.hls === 1 || s.hls === true) return; // HLS'te ICY yok
    if (!byUuid.has(s.stationuuid)) byUuid.set(s.stationuuid, { s, genre });
  };

  for (const [genre, tags] of Object.entries(GENRES)) {
    for (const tag of tags) {
      for (const s of await fetchByTag(servers, tag)) add(s, genre);
    }
    console.log(`  ${genre}: toplandı (${byUuid.size} benzersiz şu ana dek)`);
  }

  // En çok oy alan TR istasyonları (tür "?" — raporda etiketlerinden bakarız).
  for (const s of await fetchTop(servers)) add(s, "?");
  console.log(`  en-cok-oy: toplandı (${byUuid.size} benzersiz şu ana dek)`);

  // İsimle aranan aileler (Pal, Power, Kral, Number One...).
  for (const name of WANT_NAMES) {
    for (const s of await fetchByName(servers, name)) add(s, "?");
  }
  console.log(`  isimle: toplandı (${byUuid.size} benzersiz şu ana dek)`);

  const targets = [...byUuid.values()];
  console.log(`\n${targets.length} benzersiz istasyon yoklanıyor (${BATCH}'erli)...\n`);

  const rows = [];
  const counts = {};
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async ({ s, genre }) => {
        const url = s.url_resolved || s.url;
        const res = await probeIcy(url, { timeout: TIMEOUT });
        const kalite = classifyOne(s.name || "", res);
        return { s, genre, url, res, kalite };
      }),
    );
    for (const r of results) {
      counts[r.kalite] = (counts[r.kalite] || 0) + 1;
      rows.push([
        r.genre,
        s_name(r.s),
        (r.s.tags || "").slice(0, 60),
        r.url,
        r.s.codec || "",
        r.s.bitrate ?? 0,
        r.kalite,
        r.res.status === "ok" ? r.res.title || "" : `(${r.res.status})`,
      ]);
      if (r.kalite === "good") console.log(`  ✓ [${r.genre}] ${s_name(r.s)} — ${r.res.title}`);
    }
  }

  // İyi olanları başa al, sonra türe göre.
  const order = { good: 0, static: 1, junk: 2, none: 3, dead: 4 };
  rows.sort((a, b) => (order[a[6]] - order[b[6]]) || a[0].localeCompare(b[0]));

  const header = ["tur", "istasyon", "etiketler", "url", "codec", "bitrate", "kalite", "ornek_baslik"];
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
  const out = join(here, "tur-rapor.csv");
  await writeFile(out, csv, "utf8");

  console.log("\n═══ ÖZET ═══");
  for (const k of ["good", "static", "junk", "none", "dead"]) {
    console.log(`  ${k.padEnd(7)}: ${counts[k] || 0}`);
  }
  console.log(`\nRapor → ${out}`);
  console.log("İyi (good) olanları seçip bana ver, seed.json'a türleriyle ekleyeyim.");
  process.exit(0); // artık soket kalsa da temiz çık
}

function s_name(s) {
  return (s.name || "(isimsiz)").trim();
}

main().catch((err) => {
  console.error("HATA:", err.message);
  process.exit(1);
});
