// KORE ikinci dalga — HLS'e izin veren Radio Browser taraması (atılabilir keşif).
// dunya.mjs'ten farkı: hls istasyonları elenmez (çalma tarafı artık hls.js'li);
// HLS adayında ICY yoklaması yerine m3u8'e HEAD/GET erişim denemesi yapılır.
//
// Çalıştır (repo kökünden):  node probe/kore.mjs
// Çıktı: probe/kore-aday.json + probe/kore-rapor.txt

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const UA = "Simdi/0.2";
const API = "https://de1.api.radio-browser.info";
const KOTA = 12;

const TUR_ESLE = [
  ["klasik", /classical|klassik|opera/],
  ["caz", /jazz|blues|soul|funk/],
  ["elektronik", /electronic|dance|house|techno|edm|trance|chill|lounge|ambient/],
  ["rock", /rock|metal|punk/],
  ["alternatif", /alternative|indie|eclectic/],
  ["nostalji", /oldies|70s|80s|90s|retro|nostal|classics/],
  ["pop", /pop|top ?40|hits|hit music|charts|contemporary|k-?pop|kpop/],
];
const YASAK = /news|talk|sport|relig|gospel|quran|islam|church|christ|speech|sermon|buddhis|info\b/;

function tur(tags) {
  const t = (tags || "").toLowerCase();
  if (YASAK.test(t)) return null;
  for (const [ad, re] of TUR_ESLE) if (re.test(t)) return ad;
  return "pop";
}

const RENK = {
  klasik: [140, 260], caz: [20, 45], elektronik: [190, 280], rock: [0, 20],
  alternatif: [90, 170], nostalji: [25, 55], pop: [300, 350],
};
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function accent(slug, genre) {
  const [a, b] = RENK[genre] ?? [200, 260];
  const hue = a + (hash(slug) % (b - a + 1));
  const sat = 42 + (hash(slug + "s") % 20);
  const lig = 42 + (hash(slug + "l") % 14);
  const f = (n) => { const k = (n + hue / 30) % 12, c = sat / 100 * Math.min(lig / 100, 1 - lig / 100); return Math.round(255 * (lig / 100 - c * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function slugla(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
function isimKok(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).slice(0, 2).join(" ");
}

// HLS yoklaması: m3u8 erişilebilir mi?
async function probeHls(url) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) return { status: "fail" };
    const gov = (await r.text()).slice(0, 400);
    return gov.includes("#EXTM3U") ? { status: "ok" } : { status: "fail" };
  } catch { return { status: "fail" }; }
}

async function main() {
  const seed = JSON.parse(await readFile(join(here, "..", "collector", "seed.json"), "utf8"));
  const varHost = new Set(seed.map((s) => { try { return new URL(s.stream_url).host; } catch { return ""; } }));
  const varSlug = new Set(seed.map((s) => s.slug));
  const varKok = new Set(seed.map((s) => isimKok(s.name)));

  const r = await fetch(`${API}/json/stations/bycountrycodeexact/kr?hidebroken=true&order=votes&reverse=true&limit=100`, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const liste = await r.json();

  const gorulenKok = new Set();
  const filtre = [];
  for (const st of liste) {
    const url = st.url_resolved || st.url || "";
    if (!url.startsWith("https://")) continue;
    const hls = !!st.hls || /\.m3u8(\?|$)/.test(url);
    if (!hls) {
      const codec = (st.codec || "").toUpperCase();
      if (codec && !/MP3|AAC/.test(codec)) continue;
      if ((st.bitrate || 0) > 0 && st.bitrate < 64) continue;
    }
    const g = tur(st.tags);
    if (!g) continue;
    const kok = isimKok(st.name);
    if (gorulenKok.has(kok) || varKok.has(kok)) continue;
    let host; try { host = new URL(url).host; } catch { continue; }
    if (varHost.has(host)) continue;
    gorulenKok.add(kok);
    filtre.push({ st, url, g, hls });
  }

  const sonuc = [];
  for (let i = 0; i < filtre.length; i += 5) {
    const grup = filtre.slice(i, i + 5);
    const rs = await Promise.all(grup.map(async ({ st, url, g, hls }) => {
      const p = hls ? await probeHls(url) : await probeIcy(url, { timeout: 8000 });
      return { st, url, g, hls, icy: p.status, title: p.title || "" };
    }));
    sonuc.push(...rs);
    if (sonuc.filter((x) => x.icy === "ok").length >= KOTA * 2) break;
  }

  const secim = sonuc
    .filter((x) => x.icy === "ok")
    .sort((a, b) => (b.title ? 1 : 0) - (a.title ? 1 : 0) || (b.st.votes || 0) - (a.st.votes || 0))
    .slice(0, KOTA);

  const adaylar = [];
  for (const { st, url, g, hls, title } of secim) {
    let slug = slugla(st.name);
    if (!slug || varSlug.has(slug)) slug = `${slug || "radyo"}-kr`;
    if (varSlug.has(slug)) continue;
    varSlug.add(slug);
    adaylar.push({
      slug, name: st.name.trim().slice(0, 60), city: st.state?.trim() || null,
      frequency: null, stream_url: url, homepage: st.homepage?.slice(0, 200) || null,
      accent_color: accent(slug, g), band: "int", genre: g,
      metadata_quality: title ? "good" : "none", is_active: true, sort_order: 500,
      country: "kr", hls,
    });
  }

  const rapor = [`kr: liste=${liste.length} filtre=${filtre.length} probe=${sonuc.length} secilen=${secim.length} (hls=${secim.filter((x) => x.hls).length})`];
  await writeFile(join(here, "kore-aday.json"), JSON.stringify(adaylar, null, 1));
  await writeFile(join(here, "kore-rapor.txt"), rapor.join("\n"));
  console.log(rapor[0]);
  console.log(adaylar.map((a) => `${a.hls ? "[HLS] " : ""}${a.slug} · ${a.name} · ${a.genre} · meta=${a.metadata_quality}`).join("\n"));
}

main().catch((e) => { console.error("HATA:", e); process.exit(1); });
