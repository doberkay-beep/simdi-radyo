// Büyük markaların HTTPS HLS (.m3u8) yayınlarını doğrular. Bunlar oynatıcıda
// hls.js ile ÇALAR (ama ICY now-playing metadata'sı yok → "sessiz" istasyon).
// Doğrulama: URL 200 döner ve gövde #EXTM3U içerir. Açık ağda (Actions) koşar.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const BRANDS = [
  { slug: "kral-fm", name: "Kral FM", genre: "türkçe pop", accent: "#c0392b", cands: [
    "https://ssldyg.radyotvonline.com/smil/smil:kralfm.smil/playlist.m3u8",
    "https://ssldyg2.radyotvonline.com/smil/smil:kralfm.smil/playlist.m3u8",
  ]},
  { slug: "kral-pop", name: "Kral Pop", genre: "pop", accent: "#e04a7a", cands: [
    "https://ssldyg.radyotvonline.com/smil/smil:kralpop.smil/playlist.m3u8",
  ]},
  { slug: "kral-damar", name: "Kral Damar", genre: "arabesk", accent: "#9c5f7c", cands: [
    "https://ssldyg.radyotvonline.com/smil/smil:kraldamar.smil/playlist.m3u8",
  ]},
  { slug: "radyo-d", name: "Radyo D", genre: "türkçe pop", accent: "#c6503a", cands: [
    "https://ssldyg.radyotvonline.com/smil/smil:radyod.smil/playlist.m3u8",
    "https://ssldyg2.radyotvonline.com/smil/smil:radyod.smil/playlist.m3u8",
  ]},
  { slug: "best-fm", name: "Best FM", genre: "pop", accent: "#e04a4a", cands: [
    "https://ssldyg.radyotvonline.com/smil/smil:bestfm.smil/playlist.m3u8",
    "https://25583.live.streamtheworld.com/BEST_FM.aac",
  ]},
  { slug: "number1-turk", name: "Number1 Türk", genre: "türkçe pop", accent: "#c65a8a", cands: [
    "https://ssldyg.radyotvonline.com/smil/smil:number1turk.smil/playlist.m3u8",
    "https://n10101.mediatriple.net/number1turkhls/playlist.m3u8",
  ]},
  { slug: "number1-fm", name: "Number1 FM", genre: "pop", accent: "#e04a7a", cands: [
    "https://ssldyg.radyotvonline.com/smil/smil:number1fm.smil/playlist.m3u8",
    "https://n10101.mediatriple.net/number1fmhls/playlist.m3u8",
  ]},
];

async function hlsGecerli(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "simdi-hls/1.0" }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return false;
    const t = await r.text();
    return /#EXTM3U/.test(t);
  } catch {
    return false;
  }
}

const seedRaw = JSON.parse(await readFile(join(here, "../collector/seed.json"), "utf8"));
const seed = Array.isArray(seedRaw) ? seedRaw : seedRaw.stations || [];
const haveSlugs = new Set(seed.map((s) => s.slug));

let ok = 0;
let sort = 240;
for (const b of BRANDS) {
  if (haveSlugs.has(b.slug)) { console.log(`VAR  "${b.name}" (${b.slug})`); continue; }
  let win = null;
  for (const url of b.cands) {
    if (await hlsGecerli(url)) { win = url; break; }
  }
  if (!win) { console.log(`ÖLÜ  "${b.name}"  (aday: ${b.cands.length})`); continue; }
  haveSlugs.add(b.slug);
  const cand = {
    slug: b.slug, name: b.name, city: "", frequency: null,
    stream_url: win, homepage: null, accent_color: b.accent,
    band: "tr", genre: b.genre, metadata_quality: "silent",
    is_active: true, sort_order: sort++, country: "tr",
  };
  ok++;
  console.log("CAND " + JSON.stringify(cand));
}
console.log(`\n--- ${ok} HLS markası doğrulandı ---`);
