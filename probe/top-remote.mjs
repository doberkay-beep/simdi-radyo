// En popüler TR istasyonlarını (radio-browser: tıklanma + oy) toplu getirir,
// ICY ile yoklar, KATALOGDA OLMAYAN + ÇALIŞAN olanları aday olarak yazar.
// GitHub Actions'ın açık ağında koşar (yerel ortam radio-browser'ı engelliyor).
//
// Girdi: LIMIT (her sıralamadan kaç istasyon). Çıktı: loglara "CAND {...}" satırları.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const LIMIT = Number(process.env.LIMIT) || 100;
const BATCH = 12;
const TIMEOUT = 8000;

const SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
];
async function rb(path) {
  for (const s of SERVERS) {
    try {
      const r = await fetch(`${s}${path}`, {
        headers: { "User-Agent": "simdi-top/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) continue;
      const d = await r.json();
      if (Array.isArray(d)) return d;
    } catch {
      // sıradaki
    }
  }
  return [];
}

// RB etiketlerinden bizim tür adına eşle.
function guessGenre(tags = "", name = "") {
  const t = (tags + " " + name).toLocaleLowerCase("tr");
  const has = (...xs) => xs.some((x) => t.includes(x));
  if (has("arabesk")) return "arabesk";
  if (has("türkü", "turku", "halk", "folk")) return "türkü";
  if (has("sanat müziği", "tsm", "sanat muzigi")) return "tsm";
  if (has("türkçe pop", "turkce pop", "turkish pop")) return "türkçe pop";
  if (has("slow", "nostalji", "nostalgia", "oldies", "90", "80")) return "nostalji";
  if (has("metal")) return "metal";
  if (has("rock")) return "rock";
  if (has("jazz", "caz")) return "caz";
  if (has("klasik", "classical", "classic")) return "klasik";
  if (has("elektronik", "electronic", "house", "techno", "dance", "trance")) return "elektronik";
  if (has("alternatif", "alternative", "indie")) return "alternatif";
  if (has("pop", "hit", "top 40")) return "pop";
  return "";
}

function slugify(name) {
  return name
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const seed = JSON.parse(await readFile(join(here, "../collector/seed.json"), "utf8"));
const stations = Array.isArray(seed) ? seed : seed.stations;
const haveSlugs = new Set(stations.map((s) => s.slug));
const haveUrls = new Set(stations.map((s) => (s.stream_url || "").replace(/\/+$/, "")));
const haveNames = new Set(stations.map((s) => (s.name || "").toLocaleLowerCase("tr").trim()));

// Türe göre de tara (az olan türleri de doldursun).
const TAGS = [
  "türkçe pop", "türkü", "arabesk", "sanat müziği", "caz", "jazz", "klasik",
  "classical", "rock", "türk rock", "metal", "elektronik", "electronic", "house",
  "alternatif", "indie", "nostalji", "slow", "oldies", "pop", "tasavvuf",
];

console.log("En popüler TR istasyonları çekiliyor (genel + türe göre)...");
const byClick = await rb(`/json/stations/bycountrycodeexact/TR?hidebroken=true&order=clickcount&reverse=true&limit=${LIMIT}`);
const byVotes = await rb(`/json/stations/bycountrycodeexact/TR?hidebroken=true&order=votes&reverse=true&limit=${LIMIT}`);

const byUuid = new Map();
const push = (arr) => {
  for (const s of arr) {
    if (!s.stationuuid || !(s.url_resolved || s.url)) continue;
    if (s.hls === 1 || s.hls === true) continue;
    if (!byUuid.has(s.stationuuid)) byUuid.set(s.stationuuid, s);
  }
};
push(byClick);
push(byVotes);
for (const tag of TAGS) {
  push(
    await rb(
      `/json/stations/search?countrycode=TR&tag=${encodeURIComponent(tag)}` +
        `&hidebroken=true&order=clickcount&reverse=true&limit=20`,
    ),
  );
}

// Katalogda olmayanları ele.
const fresh = [...byUuid.values()].filter((s) => {
  const url = (s.url_resolved || s.url).replace(/\/+$/, "");
  const name = (s.name || "").toLocaleLowerCase("tr").trim();
  if (haveUrls.has(url)) return false;
  if (haveNames.has(name)) return false;
  if (haveSlugs.has(slugify(s.name || ""))) return false;
  return true;
});

console.log(`${byUuid.size} popüler istasyon; ${fresh.length} tanesi katalogda YOK. Yoklanıyor...\n`);

let good = 0, silent = 0, dead = 0;
for (let i = 0; i < fresh.length; i += BATCH) {
  const batch = fresh.slice(i, i + BATCH);
  const res = await Promise.all(
    batch.map(async (s) => {
      const url = s.url_resolved || s.url;
      let r;
      try {
        r = await probeIcy(url, { timeout: TIMEOUT });
      } catch {
        r = { status: "dead" };
      }
      return { s, url, r };
    }),
  );
  for (const { s, url, r } of res) {
    if (r.status !== "ok") { dead++; continue; }
    const hasTitle = !!r.title;
    if (hasTitle) good++; else silent++;
    const cand = {
      slug: slugify(s.name || ""),
      name: (s.name || "").trim(),
      stream_url: url,
      genre: guessGenre(s.tags, s.name),
      codec: `${s.codec}/${s.bitrate}`,
      title: hasTitle ? r.title.slice(0, 40) : "",
    };
    console.log(`CAND ${JSON.stringify(cand)}`);
  }
}

console.log(`\n═══ ÖZET ═══  çalışan(başlıklı): ${good}  sessiz: ${silent}  ölü: ${dead}`);
console.log("CAND satırlarından kalitelileri seçip kataloğa ekleyeceğim.");
process.exit(0);
