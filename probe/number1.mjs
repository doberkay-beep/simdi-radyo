// Number1 ailesi — streamtheworld redirect (HTTPS + ICY okunabilir) adresleri.
// ICY ile doğrular; çalışanı seed'e hazır CAND yazar. Açık ağda (Actions) koşar.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const R = "https://playerservices.streamtheworld.com/api/livestream-redirect/";

const BRANDS = [
  { slug: "number1-turk", name: "Number1 Türk", genre: "türkçe pop", accent: "#c65a8a", cands: [
    R + "NUMBER1TURK_FMAAC.aac", R + "NUMBER1_TURK.mp3", R + "NUMBER1TURKAAC.aac",
  ]},
  { slug: "number1-fm", name: "Number1 FM", genre: "pop", accent: "#e04a7a", cands: [
    R + "NUMBER1FMAAC.aac", R + "NUMBER1_FM.mp3", R + "NUMBER1FM.mp3",
  ]},
  { slug: "number1-slow", name: "Number1 Türk Slow", genre: "nostalji", accent: "#b06a9a", cands: [
    R + "NUMBER1TURK_SLOWAAC.aac", R + "NUMBER1_SLOWAAC.aac",
  ]},
  { slug: "number1-dance", name: "Number1 Dance", genre: "elektronik", accent: "#4a90d6", cands: [
    R + "NUMBER1DANCEAAC.aac", R + "NUMBER1_DANCE.mp3",
  ]},
];

const seedRaw = JSON.parse(await readFile(join(here, "../collector/seed.json"), "utf8"));
const seed = Array.isArray(seedRaw) ? seedRaw : seedRaw.stations || [];
const haveSlugs = new Set(seed.map((s) => s.slug));
const haveUrls = new Set(seed.map((s) => (s.stream_url || "").replace(/\/+$/, "")));

let ok = 0;
let sort = 250;
for (const b of BRANDS) {
  if (haveSlugs.has(b.slug)) { console.log(`VAR  "${b.name}"`); continue; }
  let win = null;
  for (const url of b.cands) {
    if (haveUrls.has(url.replace(/\/+$/, ""))) { win = "dup"; break; }
    const probe = await probeIcy(url).catch(() => null);
    if (probe && (probe.status === "ok" || probe.status === "none")) { win = url; break; }
  }
  if (win === "dup") { console.log(`DUP  "${b.name}"`); continue; }
  if (!win) { console.log(`ÖLÜ  "${b.name}"  (aday: ${b.cands.length})`); continue; }
  haveSlugs.add(b.slug);
  const cand = {
    slug: b.slug, name: b.name, city: "", frequency: null,
    stream_url: win, homepage: "https://www.numberone.com.tr", accent_color: b.accent,
    band: "tr", genre: b.genre, metadata_quality: "unknown",
    is_active: true, sort_order: sort++, country: "tr",
  };
  ok++;
  console.log("CAND " + JSON.stringify(cand));
}
console.log(`\n--- ${ok} Number1 istasyonu doğrulandı ---`);
