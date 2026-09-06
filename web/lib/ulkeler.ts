import ulkeVeri from "./ulke-veri.json";

/* Ülke katmanı — istasyon→ülke eşlemesi web tarafında yaşar (DB'de sütun yok).
   ulke-veri.json, collector/seed.json'dan scripts/ulke-uret.mjs ile üretilir. */

export type UlkeKodu = keyof typeof ULKELER;

export const ULKELER = {
  tr: { tr: "Türkiye", en: "Turkey", sira: 0 },
  de: { tr: "Almanya", en: "Germany", sira: 10 },
  fr: { tr: "Fransa", en: "France", sira: 11 },
  gb: { tr: "Birleşik Krallık", en: "United Kingdom", sira: 12 },
  us: { tr: "ABD", en: "United States", sira: 13 },
  it: { tr: "İtalya", en: "Italy", sira: 14 },
  es: { tr: "İspanya", en: "Spain", sira: 15 },
  nl: { tr: "Hollanda", en: "Netherlands", sira: 16 },
  be: { tr: "Belçika", en: "Belgium", sira: 17 },
  ch: { tr: "İsviçre", en: "Switzerland", sira: 18 },
  at: { tr: "Avusturya", en: "Austria", sira: 19 },
  pt: { tr: "Portekiz", en: "Portugal", sira: 20 },
  gr: { tr: "Yunanistan", en: "Greece", sira: 21 },
  se: { tr: "İsveç", en: "Sweden", sira: 22 },
  no: { tr: "Norveç", en: "Norway", sira: 23 },
  dk: { tr: "Danimarka", en: "Denmark", sira: 24 },
  fi: { tr: "Finlandiya", en: "Finland", sira: 25 },
  ie: { tr: "İrlanda", en: "Ireland", sira: 26 },
  pl: { tr: "Polonya", en: "Poland", sira: 27 },
  cz: { tr: "Çekya", en: "Czechia", sira: 28 },
  hu: { tr: "Macaristan", en: "Hungary", sira: 29 },
  ro: { tr: "Romanya", en: "Romania", sira: 30 },
  jp: { tr: "Japonya", en: "Japan", sira: 40 },
  kr: { tr: "Güney Kore", en: "South Korea", sira: 41 },
  in: { tr: "Hindistan", en: "India", sira: 42 },
  br: { tr: "Brezilya", en: "Brazil", sira: 50 },
  ar: { tr: "Arjantin", en: "Argentina", sira: 51 },
  mx: { tr: "Meksika", en: "Mexico", sira: 52 },
  ca: { tr: "Kanada", en: "Canada", sira: 53 },
  au: { tr: "Avustralya", en: "Australia", sira: 60 },
  za: { tr: "Güney Afrika", en: "South Africa", sira: 61 },
  www: { tr: "Çevrimiçi", en: "Online only", sira: 90 },
} as const;

/* URL slug'ları Türkçe (SEO): /ulke/almanya gibi. */
export const ULKE_SLUG: Record<string, UlkeKodu> = Object.fromEntries(
  (Object.keys(ULKELER) as UlkeKodu[]).map((k) => [
    ULKELER[k].tr
      .replace(/İ/g, "i").replace(/I/g, "i") // toLowerCase'ten ÖNCE: "İ" birleşik noktalı "i̇" üretir
      .toLowerCase()
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
      .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-"),
    k,
  ])
) as Record<string, UlkeKodu>;

export function ulkeSlug(kod: UlkeKodu): string {
  return Object.entries(ULKE_SLUG).find(([, k]) => k === kod)![0];
}

/* Bayrak: gerçek ülkeler flagcdn görseli, çevrimiçi 🌐. */
export function bayrakUrl(kod: UlkeKodu): string | null {
  return kod === "www" ? null : `https://flagcdn.com/w40/${kod}.png`;
}

/* Temsilî saat dilimi (başkent) — atlas kartlarındaki yerel saat için. */
export const SAAT_DILIMI: Record<UlkeKodu, string | null> = {
  tr: "Europe/Istanbul", de: "Europe/Berlin", fr: "Europe/Paris", gb: "Europe/London",
  us: "America/New_York", it: "Europe/Rome", es: "Europe/Madrid", nl: "Europe/Amsterdam",
  be: "Europe/Brussels", ch: "Europe/Zurich", at: "Europe/Vienna", pt: "Europe/Lisbon",
  gr: "Europe/Athens", se: "Europe/Stockholm", no: "Europe/Oslo", dk: "Europe/Copenhagen",
  fi: "Europe/Helsinki", ie: "Europe/Dublin", pl: "Europe/Warsaw", cz: "Europe/Prague",
  hu: "Europe/Budapest", ro: "Europe/Bucharest", jp: "Asia/Tokyo", kr: "Asia/Seoul",
  in: "Asia/Kolkata", br: "America/Sao_Paulo", ar: "America/Argentina/Buenos_Aires",
  mx: "America/Mexico_City", ca: "America/Toronto", au: "Australia/Sydney",
  za: "Africa/Johannesburg", www: null,
};

/* Emoji bayrak — ISO kodundan bölgesel gösterge harfleriyle üretilir. */
export function bayrakEmoji(kod: UlkeKodu): string {
  if (kod === "www") return "🌐";
  return String.fromCodePoint(...[...kod].map((c) => 0x1f1e6 + c.charCodeAt(0) - 97));
}

/* İstasyon slug'ı → ülke kodu. */
export function istasyonUlkesi(slug: string): UlkeKodu {
  return ((ulkeVeri as Record<string, string>)[slug] as UlkeKodu) ?? "www";
}

/* Katalogda istasyonu olan ülkeler, sıraya dizili. */
export function doluUlkeler(): UlkeKodu[] {
  const var_ = new Set(Object.values(ulkeVeri as Record<string, string>));
  return (Object.keys(ULKELER) as UlkeKodu[])
    .filter((k) => var_.has(k))
    .sort((a, b) => ULKELER[a].sira - ULKELER[b].sira);
}

export function ulkeIstasyonSluglari(kod: UlkeKodu): string[] {
  return Object.entries(ulkeVeri as Record<string, string>)
    .filter(([, c]) => c === kod)
    .map(([s]) => s);
}
