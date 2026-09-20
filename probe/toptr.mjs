// En çok dinlenen/aranan TR istasyonları (kataloğumuzda eksik olanlar)
// radio-browser'da arar, ICY doğrular, çalışan + katalogda olmayanları
// seed'e hazır CAND yazar. HLS/playlist elenir. Açık ağda koşar.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// { q, genre, accent }  — hepsi band "tr". RTÜK/arama hacmi yüksek olanlar.
const WANT = [
  { q: "Kral FM", genre: "türkçe pop", accent: "#c0392b" },
  { q: "Kral Pop", genre: "pop", accent: "#e04a7a" },
  { q: "Kral Damar", genre: "arabesk", accent: "#9c5f7c" },
  { q: "Power Türk", genre: "türkçe pop", accent: "#d13b3b" },
  { q: "PowerTürk", genre: "türkçe pop", accent: "#d13b3b" },
  { q: "Power FM", genre: "pop", accent: "#e0475f" },
  { q: "Power Pop", genre: "pop", accent: "#e04a7a" },
  { q: "Power Love", genre: "nostalji", accent: "#b06a9a" },
  { q: "Best FM Türkiye", genre: "pop", accent: "#e04a4a" },
  { q: "Show Radyo", genre: "türkçe pop", accent: "#c65a8a" },
  { q: "Radyo D", genre: "türkçe pop", accent: "#c6503a" },
  { q: "Radyo Viva", genre: "nostalji", accent: "#8a7ab0" },
  { q: "Number1 Türk", genre: "türkçe pop", accent: "#c65a8a" },
  { q: "Number1 FM", genre: "pop", accent: "#e04a7a" },
  { q: "Number1 Dance", genre: "elektronik", accent: "#4a90d6" },
  { q: "Radyo Fenomen", genre: "pop", accent: "#e0475f" },
  { q: "Fenomen Türk", genre: "türkçe pop", accent: "#c65a8a" },
  { q: "Süper FM", genre: "türkçe pop", accent: "#d13b3b" },
  { q: "Kiss FM Türkiye", genre: "pop", accent: "#e04a7a" },
  { q: "Radyo Viva Türkiye", genre: "nostalji", accent: "#8a7ab0" },
  { q: "TRT Nağme", genre: "tsm", accent: "#b0708a" },
  { q: "TRT Türkü", genre: "türkü", accent: "#7d9a5a" },
  { q: "Lig Radyo", genre: "haber", accent: "#4a7a9a" },
  { q: "Radyo Mega", genre: "pop", accent: "#e04a7a" },
];

const SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
];

async function byName(name) {
  for (const s of SERVERS) {
    try {
      const r = await fetch(
        `${s}/json/stations/byname/${encodeURIComponent(name)}?hidebroken=true&order=votes&reverse=true&limit=10&countrycode=TR`,
        { headers: { "User-Agent": "simdi-toptr/1.0" }, signal: AbortSignal.timeout(15000) },
      );
      if (!r.ok) continue;
      const d = await r.json();
      if (Array.isArray(d) && d.length) return d;
    } catch {
      // sıradaki
    }
  }
  // TR filtresi boşsa genel dene
  for (const s of SERVERS) {
    try {
      const r = await fetch(
        `${s}/json/stations/byname/${encodeURIComponent(name)}?hidebroken=true&order=votes&reverse=true&limit=10`,
        { headers: { "User-Agent": "simdi-toptr/1.0" }, signal: AbortSignal.timeout(15000) },
      );
      if (!r.ok) continue;
      const d = await r.json();
      if (Array.isArray(d)) return d;
    } catch {
      // sıradaki
    }
  }
  return [];
}

function slugify(name) {
  return name
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

const seedRaw = JSON.parse(await readFile(join(here, "../collector/seed.json"), "utf8"));
const seed = Array.isArray(seedRaw) ? seedRaw : seedRaw.stations || [];
const haveSlugs = new Set(seed.map((s) => s.slug));
const haveUrls = new Set(seed.map((s) => (s.stream_url || "").replace(/\/+$/, "")));
const oynatilamaz = (u) => /\.m3u8(\?|$)|\.pls(\?|$)|\.m3u(\?|$)/i.test(u);

let ok = 0;
let sort = 200; // TR aralığı
for (const w of WANT) {
  const list = await byName(w.q);
  if (!list.length) { console.log(`YOK  "${w.q}"`); continue; }
  const sorted = list.sort((a, b) => (b.url_resolved || "").startsWith("https") - (a.url_resolved || "").startsWith("https"));
  let picked = null;
  for (const st of sorted) {
    const url = (st.url_resolved || st.url || "").trim();
    if (!url || oynatilamaz(url)) continue;
    if (haveUrls.has(url.replace(/\/+$/, ""))) { picked = "dup"; break; }
    const probe = await probeIcy(url).catch(() => null);
    if (probe && (probe.status === "ok" || probe.status === "none")) { picked = { st, url }; break; }
  }
  if (picked === "dup") { console.log(`DUP  "${w.q}"`); continue; }
  if (!picked) { console.log(`ÖLÜ  "${w.q}"`); continue; }

  let slug = slugify(w.q);
  if (haveSlugs.has(slug)) slug = slugify(picked.st.name);
  if (haveSlugs.has(slug)) { console.log(`DUP2 "${w.q}"`); continue; }
  haveSlugs.add(slug);

  const cand = {
    slug,
    name: picked.st.name.trim().replace(/\s+/g, " ").slice(0, 60),
    city: "",
    frequency: null,
    stream_url: picked.url,
    homepage: picked.st.homepage || null,
    accent_color: w.accent,
    band: "tr",
    genre: w.genre,
    metadata_quality: "unknown",
    is_active: true,
    sort_order: sort++,
    country: "tr",
  };
  ok++;
  console.log("CAND " + JSON.stringify(cand));
}

console.log(`\n--- ${ok}/${WANT.length} çalışan top-TR istasyonu bulundu ---`);
