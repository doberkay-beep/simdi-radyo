// Haber/talk istasyonları (TR + yabancı-İngilizce) radio-browser'da arar,
// ICY ile yoklar, KATALOGDA OLMAYAN + ÇALIŞAN olanları seed'e hazır CAND yazar.
// HLS-only / ölü olanlar ICY'de elenir. Açık ağda (GitHub Actions) koşar.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// { q, band, accent, yer }  — hepsi genre "haber". Kürtçe YOK.
const WANT = [
  // ── Türkçe haber / talk ──
  { q: "NTV Radyo", band: "tr", accent: "#4a6fa5", yer: "İstanbul" },
  { q: "TRT Radyo Haber", band: "tr", accent: "#5f7a9a", yer: "Ankara" },
  { q: "TRT Radyo 1", band: "tr", accent: "#5a86c6", yer: "Ankara" },
  { q: "Bloomberg HT", band: "tr", accent: "#3a6a8a", yer: "İstanbul" },
  { q: "Haberturk Radyo", band: "tr", accent: "#c6503a", yer: "İstanbul" },
  { q: "CNN Türk Radyo", band: "tr", accent: "#b0433a", yer: "İstanbul" },
  { q: "TGRT Haber Radyo", band: "tr", accent: "#4a7a9a", yer: "İstanbul" },
  { q: "Anadolu Ajansı radyo", band: "tr", accent: "#5f8f8a", yer: "Ankara" },
  { q: "Sözcü Radyo", band: "tr", accent: "#6a86b8", yer: "İstanbul" },
  // ── Yabancı İngilizce haber / talk (İngilizce öğrenmek için) ──
  { q: "BBC World Service", band: "int", accent: "#b0433a", yer: "Londra" },
  { q: "NPR News", band: "int", accent: "#4a6fa5", yer: "Washington" },
  { q: "Voice of America", band: "int", accent: "#5a7ab0", yer: "Washington" },
  { q: "Deutsche Welle English", band: "int", accent: "#6a86b8", yer: "Berlin" },
  { q: "France 24 English", band: "int", accent: "#3a6a9a", yer: "Paris" },
  { q: "Al Jazeera English", band: "int", accent: "#c69a4a", yer: "Doha" },
  { q: "ABC NewsRadio", band: "int", accent: "#4a8a9a", yer: "Sydney" },
  { q: "CBC Radio One", band: "int", accent: "#c6503a", yer: "Toronto" },
  { q: "LBC London", band: "int", accent: "#5f6a9a", yer: "Londra" },
  { q: "Times Radio", band: "int", accent: "#4a6a8a", yer: "Londra" },
  { q: "talkRADIO", band: "int", accent: "#8a5a5a", yer: "Londra" },
  { q: "RTE Radio 1", band: "int", accent: "#4a9a6a", yer: "Dublin" },
  { q: "Newstalk", band: "int", accent: "#5a7a9a", yer: "Dublin" },
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
        `${s}/json/stations/byname/${encodeURIComponent(name)}?hidebroken=true&order=votes&reverse=true&limit=10`,
        { headers: { "User-Agent": "simdi-news/1.0" }, signal: AbortSignal.timeout(15000) },
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

// HLS (.m3u8) ve playlist (.pls/.m3u) adreslerini ele — oynatıcı çalamaz.
const oynatilamaz = (u) => /\.m3u8(\?|$)|\.pls(\?|$)|\.m3u(\?|$)/i.test(u);

let ok = 0;
let sort = 950;
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

  let slug = slugify(picked.st.name);
  if (!slug || haveSlugs.has(slug)) slug = slugify(w.q);
  if (haveSlugs.has(slug)) slug = `${slug}-haber`;
  haveSlugs.add(slug);

  const cand = {
    slug,
    name: picked.st.name.trim().replace(/\s+/g, " ").slice(0, 60),
    city: w.yer || picked.st.country || "",
    frequency: null,
    stream_url: picked.url,
    homepage: picked.st.homepage || null,
    accent_color: w.accent,
    band: w.band,
    genre: "haber",
    metadata_quality: "unknown",
    is_active: true,
    sort_order: sort++,
    country: w.band === "tr" ? "tr" : (picked.st.countrycode || "").toLowerCase() || "int",
  };
  ok++;
  console.log("CAND " + JSON.stringify(cand));
}

console.log(`\n--- ${ok}/${WANT.length} çalışan haber istasyonu bulundu ---`);
