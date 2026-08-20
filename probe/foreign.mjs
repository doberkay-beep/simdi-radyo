// Seçili YABANCI istasyonları radio-browser'da isimle arar, ICY ile yoklar,
// KATALOGDA OLMAYAN + ÇALIŞAN olanları seed'e hazır "CAND {...}" olarak yazar.
// GitHub Actions'ın açık ağında koşar (yerel ortam radio-browser'ı engelliyor).
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// Küratörlü liste — kullanıcının çok dinlediği klasik/akustik/rock ağırlıklı,
// dünyaca bilinen, yayın adresi güvenilir istasyonlar. { q, genre, accent, ulke }
const WANT = [
  // ── Klasik ──
  { q: "BBC Radio 3", genre: "klasik", accent: "#8e6fb0", ulke: "Londra" },
  { q: "France Musique", genre: "klasik", accent: "#b0506a", ulke: "Paris" },
  { q: "Venice Classic Radio", genre: "klasik", accent: "#9a7b4f", ulke: "Venedik" },
  { q: "Klara", genre: "klasik", accent: "#5f8fae", ulke: "Brüksel" },
  { q: "Radio Clasica RNE", genre: "klasik", accent: "#a05b4a", ulke: "Madrid" },
  { q: "WQXR", genre: "klasik", accent: "#6a86b8", ulke: "New York" },
  { q: "Classical KUSC", genre: "klasik", accent: "#7d6bb0", ulke: "Los Angeles" },
  { q: "Radio Classique", genre: "klasik", accent: "#9c5f7c", ulke: "Paris" },
  { q: "Concertzender Klassiek", genre: "klasik", accent: "#5f8f8a", ulke: "Utrecht" },
  { q: "P2 Sveriges Radio", genre: "klasik", accent: "#6f8fb0", ulke: "Stockholm" },
  // ── Caz ──
  { q: "Jazz24", genre: "caz", accent: "#b98a4a", ulke: "Seattle" },
  { q: "WBGO", genre: "caz", accent: "#c07a3a", ulke: "Newark" },
  { q: "Radio Swiss Jazz", genre: "caz", accent: "#a86f4a", ulke: "Zürih" },
  { q: "Jazz FM UK", genre: "caz", accent: "#b06a5a", ulke: "Londra" },
  { q: "WWOZ", genre: "caz", accent: "#bd8a3f", ulke: "New Orleans" },
  { q: "Sunny Jazz", genre: "caz", accent: "#c98a4a", ulke: "" },
  // ── Rock / Alternatif ──
  { q: "BBC Radio 6 Music", genre: "alternatif", accent: "#c65a6a", ulke: "Londra" },
  { q: "KCRW Eclectic24", genre: "alternatif", accent: "#5a86c6", ulke: "Los Angeles" },
  { q: "The Current MPR", genre: "alternatif", accent: "#4a9a8a", ulke: "Minnesota" },
  { q: "Triple J", genre: "alternatif", accent: "#c6503a", ulke: "Sydney" },
  { q: "WFMU", genre: "alternatif", accent: "#8a6ab0", ulke: "New Jersey" },
  { q: "WXPN", genre: "alternatif", accent: "#5a7ab0", ulke: "Philadelphia" },
  { q: "Radio X UK", genre: "rock", accent: "#c6473a", ulke: "Londra" },
  { q: "FluxFM", genre: "alternatif", accent: "#6a9a5a", ulke: "Berlin" },
  { q: "radioeins", genre: "alternatif", accent: "#c6603a", ulke: "Berlin" },
  { q: "Double J", genre: "rock", accent: "#b0503a", ulke: "Sydney" },
  // ── Elektronik ──
  { q: "Rinse FM", genre: "elektronik", accent: "#4a90d6", ulke: "Londra" },
  { q: "Worldwide FM", genre: "elektronik", accent: "#d6a04a", ulke: "Londra" },
  { q: "SomaFM Drone Zone", genre: "elektronik", accent: "#5a7a9a", ulke: "San Francisco" },
  { q: "SomaFM Space Station Soma", genre: "elektronik", accent: "#6a5a9a", ulke: "San Francisco" },
  { q: "FIP", genre: "elektronik", accent: "#c6395a", ulke: "Paris" },
  { q: "Nova la radio", genre: "elektronik", accent: "#c65a8a", ulke: "Paris" },
  { q: "Proton Radio", genre: "elektronik", accent: "#4a7ad6", ulke: "" },
  // ── Pop / Hit ──
  { q: "BBC Radio 1", genre: "pop", accent: "#e0475f", ulke: "Londra" },
  { q: "BBC Radio 2", genre: "pop", accent: "#d65f7a", ulke: "Londra" },
  { q: "NRJ", genre: "pop", accent: "#e04a4a", ulke: "Paris" },
  { q: "Absolute Radio", genre: "pop", accent: "#c6503a", ulke: "Londra" },
  { q: "Capital FM UK", genre: "pop", accent: "#e04a7a", ulke: "Londra" },
  // ── Nostalji / Akustik / Odak ──
  { q: "Radio Paradise Mellow Mix", genre: "alternatif", accent: "#7a9ab0", ulke: "Kaliforniya" },
  { q: "SomaFM Deep Space One", genre: "elektronik", accent: "#5a6a9a", ulke: "San Francisco" },
  { q: "SomaFM Lush", genre: "pop", accent: "#b06a9a", ulke: "San Francisco" },
  { q: "Absolute 80s", genre: "nostalji", accent: "#c65a8a", ulke: "Londra" },
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
        `${s}/json/stations/byname/${encodeURIComponent(name)}?hidebroken=true&order=votes&reverse=true&limit=8`,
        { headers: { "User-Agent": "simdi-foreign/1.0" }, signal: AbortSignal.timeout(15000) },
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

// Katalogdaki mevcut slug ve URL'leri oku (tekrarları ele).
const seedRaw = JSON.parse(await readFile(join(here, "../collector/seed.json"), "utf8"));
const seed = Array.isArray(seedRaw) ? seedRaw : seedRaw.stations || [];
const haveSlugs = new Set(seed.map((s) => s.slug));
const haveUrls = new Set(seed.map((s) => (s.stream_url || "").replace(/\/+$/, "")));

let ok = 0;
let sort = 900; // yabancılar sona
for (const w of WANT) {
  const list = await byName(w.q);
  if (!list.length) {
    console.log(`YOK  "${w.q}"`);
    continue;
  }
  // En oylu, HTTPS tercihli, ICY doğrulanan ilk adayı seç.
  let picked = null;
  const sorted = list.sort((a, b) => (b.url_resolved || "").startsWith("https") - (a.url_resolved || "").startsWith("https"));
  for (const st of sorted) {
    const url = (st.url_resolved || st.url || "").trim();
    if (!url) continue;
    if (haveUrls.has(url.replace(/\/+$/, ""))) { picked = "dup"; break; }
    const probe = await probeIcy(url).catch(() => null);
    if (probe && (probe.status === "ok" || probe.status === "none")) {
      picked = { st, url };
      break;
    }
  }
  if (picked === "dup") { console.log(`DUP  "${w.q}"`); continue; }
  if (!picked) { console.log(`ÖLÜ  "${w.q}"`); continue; }

  let slug = slugify(picked.st.name);
  if (!slug || haveSlugs.has(slug)) slug = slugify(w.q);
  if (haveSlugs.has(slug)) slug = `${slug}-int`;
  haveSlugs.add(slug);

  const cand = {
    slug,
    name: picked.st.name.trim().replace(/\s+/g, " ").slice(0, 60),
    city: w.ulke || (picked.st.country || ""),
    frequency: null,
    stream_url: picked.url,
    homepage: picked.st.homepage || null,
    accent_color: w.accent,
    band: "int",
    metadata_quality: "unknown",
    is_active: true,
    sort_order: sort++,
    genre: w.genre,
  };
  ok++;
  console.log("CAND " + JSON.stringify(cand));
}

console.log(`\n--- ${ok}/${WANT.length} çalışan yabancı istasyon bulundu ---`);
