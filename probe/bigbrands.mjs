// Büyük TR markaları (Kral FM, PowerTürk, Radyo D, Number1 vb.) radio-browser'da
// temiz çıkmıyor. Bunların RESMİ CDN adres kalıplarını (listen.powerapp.com.tr,
// *.radyotvonline.net) aday olarak dener, ICY ile DOĞRULAR, çalışanı seed'e hazır
// CAND olarak yazar. Doğrulanmayan aday sessizce elenir — tahmin seed'e girmez.
// Açık ağda (GitHub Actions) koşar.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// Her marka için birden çok resmi aday. İlk DOĞRULANAN kazanır.
const BRANDS = [
  {
    slug: "kral-fm", name: "Kral FM", genre: "türkçe pop", accent: "#c0392b",
    cands: [
      "https://kralfm.radyotvonline.net/kralfm",
      "https://dygedge.radyotvonline.net/kralfm/playlist.m3u8",
      "https://46.20.7.6/;stream",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KRAL_FM.mp3",
    ],
  },
  {
    slug: "kral-pop", name: "Kral Pop", genre: "pop", accent: "#e04a7a",
    cands: [
      "https://kralpop.radyotvonline.net/kralpop",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KRAL_POP.mp3",
    ],
  },
  {
    slug: "powerturk", name: "PowerTürk", genre: "türkçe pop", accent: "#d13b3b",
    cands: [
      "https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio",
      "https://listen.powerapp.com.tr/powerturk/abr/playlist.m3u8",
    ],
  },
  {
    slug: "power-fm", name: "Power FM", genre: "pop", accent: "#e0475f",
    cands: [
      "https://listen.powerapp.com.tr/power/mpeg/icecast.audio",
      "https://listen.powerapp.com.tr/powerfm/mpeg/icecast.audio",
    ],
  },
  {
    slug: "power-pop", name: "Power Pop", genre: "pop", accent: "#e04a7a",
    cands: ["https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio"],
  },
  {
    slug: "power-love", name: "Power Love", genre: "nostalji", accent: "#b06a9a",
    cands: ["https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio"],
  },
  {
    slug: "radyo-d", name: "Radyo D", genre: "türkçe pop", accent: "#c6503a",
    cands: [
      "https://radyod.radyotvonline.net/radyod",
      "https://dygedge.radyotvonline.net/radyod/playlist.m3u8",
    ],
  },
  {
    slug: "best-fm", name: "Best FM", genre: "pop", accent: "#e04a4a",
    cands: [
      "https://bestfm.radyotvonline.net/bestfm",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/BEST_FM.mp3",
      "https://moondigitaledge.radyotvonline.net/bestfm/playlist.m3u8",
    ],
  },
  {
    slug: "show-radyo", name: "Show Radyo", genre: "türkçe pop", accent: "#c65a8a",
    cands: [
      "https://showradyo.radyotvonline.net/showradyo",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/SHOW_RADYO.mp3",
    ],
  },
  {
    slug: "number1-turk", name: "Number1 Türk", genre: "türkçe pop", accent: "#c65a8a",
    cands: [
      "https://n10101.mediatriple.net/number1turk",
      "https://sc.number1.com.tr/number1turk",
    ],
  },
  {
    slug: "number1-fm", name: "Number1 FM", genre: "pop", accent: "#e04a7a",
    cands: [
      "https://n10101.mediatriple.net/number1fm",
      "https://sc.number1.com.tr/number1fm",
    ],
  },
  {
    slug: "slow-turk", name: "Slow Türk", genre: "nostalji", accent: "#8a7ab0",
    cands: [
      "https://slowturk.radyotvonline.net/slowturk",
      "https://dygedge.radyotvonline.net/slowturk/playlist.m3u8",
    ],
  },
  {
    slug: "radyo-7", name: "Radyo 7", genre: "türkçe pop", accent: "#5a9a6a",
    cands: [
      "https://radyo7.radyotvonline.net/radyo7",
      "https://moondigitaledge.radyotvonline.net/radyo7/playlist.m3u8",
    ],
  },
  {
    slug: "metro-fm", name: "Metro FM", genre: "pop", accent: "#e04a7a",
    cands: [
      "https://25573.live.streamtheworld.com/METRO_FM_SC",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM.mp3",
    ],
  },
  {
    slug: "joy-fm", name: "Joy FM", genre: "nostalji", accent: "#8a7ab0",
    cands: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM.mp3",
      "https://17603.live.streamtheworld.com/JOY_FM_SC",
    ],
  },
  {
    slug: "joy-turk", name: "Joy Türk", genre: "türkçe pop", accent: "#c65a8a",
    cands: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK.mp3",
      "https://17663.live.streamtheworld.com/JOY_TURK_SC",
    ],
  },
];

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

// HLS/playlist adreslerini oynatıcı çalamaz — ICY için de anlamsız, ele.
const oynatilamaz = (u) => /\.m3u8(\?|$)|\.pls(\?|$)|\.m3u(\?|$)/i.test(u);

let ok = 0;
let sort = 210;
for (const b of BRANDS) {
  if (haveSlugs.has(b.slug)) { console.log(`VAR  "${b.name}" (${b.slug})`); continue; }
  let win = null;
  for (const url of b.cands) {
    if (oynatilamaz(url)) continue;
    if (haveUrls.has(url.replace(/\/+$/, ""))) { win = "dup"; break; }
    const probe = await probeIcy(url).catch(() => null);
    if (probe && (probe.status === "ok" || probe.status === "none")) { win = url; break; }
  }
  if (win === "dup") { console.log(`DUP  "${b.name}"`); continue; }
  if (!win) { console.log(`ÖLÜ  "${b.name}"  (aday sayısı: ${b.cands.length})`); continue; }

  haveSlugs.add(b.slug);
  const cand = {
    slug: b.slug,
    name: b.name,
    city: "",
    frequency: null,
    stream_url: win,
    homepage: null,
    accent_color: b.accent,
    band: "tr",
    genre: b.genre,
    metadata_quality: "unknown",
    is_active: true,
    sort_order: sort++,
    country: "tr",
  };
  ok++;
  console.log("CAND " + JSON.stringify(cand));
}

console.log(`\n--- ${ok}/${BRANDS.length} büyük marka doğrulandı ---`);
