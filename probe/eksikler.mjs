// Hâlâ eksik büyük markalar (Kral FM, Radyo D, Best FM, Number1) için
// GENİŞLETİLMİŞ resmi-CDN aday listesi. ICY ile doğrular; yalnızca çalışan
// adres CAND olarak çıkar. Tahmin seed'e girmez. Açık ağda (Actions) koşar.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const BRANDS = [
  {
    slug: "kral-fm", name: "Kral FM", genre: "türkçe pop", accent: "#c0392b",
    cands: [
      // Demirören/Karnaval ağı yaygın kalıpları
      "https://dygtdxr1x1rp.cloudfront.net/kralfm/playlist.m3u8",
      "https://16443.live.streamtheworld.com/KRAL_FM.mp3",
      "https://17673.live.streamtheworld.com/KRAL_FMAAC.aac",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KRAL_FMAAC.aac",
      "https://trkvz-radyo.radyotvonline.net/kralfm",
      "https://sunucu1.radyotvonline.net/kralfm",
    ],
  },
  {
    slug: "kral-pop", name: "Kral Pop", genre: "pop", accent: "#e04a7a",
    cands: [
      "https://17693.live.streamtheworld.com/KRAL_POP.mp3",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KRAL_POPAAC.aac",
    ],
  },
  {
    slug: "radyo-d", name: "Radyo D", genre: "türkçe pop", accent: "#c6503a",
    cands: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/RADYO_D.mp3",
      "https://17703.live.streamtheworld.com/RADYO_D.mp3",
      "https://trkvz-radyo.radyotvonline.net/radyod",
      "https://sunucu1.radyotvonline.net/radyod",
    ],
  },
  {
    slug: "best-fm", name: "Best FM", genre: "pop", accent: "#e04a4a",
    cands: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/BEST_FMAAC.aac",
      "https://17713.live.streamtheworld.com/BEST_FM.mp3",
      "https://radyo.duxxan.com/bestfm",
      "https://sunucu1.mediatriple.net/bestfm",
    ],
  },
  {
    slug: "number1-turk", name: "Number1 Türk", genre: "türkçe pop", accent: "#c65a8a",
    cands: [
      "https://sc.number1.com.tr:2020/stream",
      "https://n1turk.radyotvonline.net/n1turk",
      "https://str2.openstream.co/2029",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/NUMBER1_TURK.mp3",
    ],
  },
  {
    slug: "number1-fm", name: "Number1 FM", genre: "pop", accent: "#e04a7a",
    cands: [
      "https://sc.number1.com.tr:2000/stream",
      "https://n1fm.radyotvonline.net/n1fm",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/NUMBER1_FM.mp3",
    ],
  },
  {
    slug: "kiss-fm", name: "Kiss FM", genre: "pop", accent: "#e04a7a",
    cands: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KISS_FM.mp3",
      "https://17723.live.streamtheworld.com/KISS_FM.mp3",
    ],
  },
  {
    slug: "radyo-viva-2", name: "Radyo Viva", genre: "nostalji", accent: "#8a7ab0",
    cands: [], // zaten eklendi — atlanır
  },
];

const seedRaw = JSON.parse(await readFile(join(here, "../collector/seed.json"), "utf8"));
const seed = Array.isArray(seedRaw) ? seedRaw : seedRaw.stations || [];
const haveSlugs = new Set(seed.map((s) => s.slug));
const haveUrls = new Set(seed.map((s) => (s.stream_url || "").replace(/\/+$/, "")));
const oynatilamaz = (u) => /\.m3u8(\?|$)|\.pls(\?|$)|\.m3u(\?|$)/i.test(u);

let ok = 0;
let sort = 230;
for (const b of BRANDS) {
  if (haveSlugs.has(b.slug)) { console.log(`VAR  "${b.name}" (${b.slug})`); continue; }
  if (!b.cands.length) { console.log(`GEÇ  "${b.name}" (aday yok)`); continue; }
  let win = null;
  for (const url of b.cands) {
    if (oynatilamaz(url)) continue;
    if (haveUrls.has(url.replace(/\/+$/, ""))) { win = "dup"; break; }
    const probe = await probeIcy(url).catch(() => null);
    if (probe && (probe.status === "ok" || probe.status === "none")) { win = url; break; }
  }
  if (win === "dup") { console.log(`DUP  "${b.name}"`); continue; }
  if (!win) { console.log(`ÖLÜ  "${b.name}"  (aday: ${b.cands.length})`); continue; }

  haveSlugs.add(b.slug);
  const cand = {
    slug: b.slug, name: b.name, city: "", frequency: null,
    stream_url: win, homepage: null, accent_color: b.accent,
    band: "tr", genre: b.genre, metadata_quality: "unknown",
    is_active: true, sort_order: sort++, country: "tr",
  };
  ok++;
  console.log("CAND " + JSON.stringify(cand));
}
console.log(`\n--- ${ok} eksik marka doğrulandı ---`);
