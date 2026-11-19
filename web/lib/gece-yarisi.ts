import { unstable_cache } from "next/cache";
import ulkeVeri from "./ulke-veri.json";
import dilimVeri from "./saat-dilimi-veri.json";
import { ULKELER, SAAT_DILIMI, type UlkeKodu } from "./ulkeler";
import { temizMetin, parcaAdi } from "./cop";
import { getSupabase } from "./supabase";

/* GECE YARISI NE ÇALIYORDU? — yılbaşı gecesi her radyoda yerel saatle 00:00'da çalan şarkı.
 *
 * Yük: Supabase'e dokunmaz (yalnız saatte bir küçük "meta_gizli" listesi). Çalınan şarkılar
 * Hetzner'deki arşiv kopyasından (api.nowby.co, archive_at) okunur: gece yarısı aynı ana denk
 * gelen saat dilimleri tek grup, her grup için iki çağrı (00:00 ve 00:03), sonuç kalıcı
 * önbellekte. Bütün gece en çok ~25 grup × 2 çağrı. Henüz gece yarısına girmemiş grup çağrılmaz.
 */

export type Dil = "tr" | "en";

export type GySatir = {
  slug: string;
  ad: string;
  ulke: string; // ISO kodu
  sehir: string | null; // başkent dışı dilimdeyse şehir (Los Angeles, Adelaide…)
  artist: string | null;
  title: string | null;
  sonra: boolean; // 00:00'da sessizdi/eskiydi; 00:00–00:03 arası başlayan ilk şarkı
};

export type GyGrup = {
  an: string; // gece yarısının UTC anı (ISO)
  yerler: { ulke: string; sehir: string | null }[]; // bu anda yeni güne girenler
  durum: "bekliyor" | "hazirlaniyor" | "hazir" | "okunamadi";
  satirlar: GySatir[];
  istasyon: number; // gruptaki radyo sayısı (şarkısı bulunamayanlar dahil)
};

export type GyVeri = {
  tarih: string; // yerel tarih (YYYY-MM-DD) — yılbaşı için "2027-01-01"
  simdi: string;
  gruplar: GyGrup[];
};

const ARSIV_URL = process.env.ARSIV_URL && /^https?:\/\/[\x21-\x7e]+$/.test(process.env.ARSIV_URL)
  ? process.env.ARSIV_URL
  : "https://api.nowby.co";

// Listede başkentte olmayan iki ülke (katalogda var, ULKELER'de yok).
const EK_DILIM: Record<string, string> = { lt: "Europe/Vilnius", mk: "Europe/Skopje" };

const ESKI_DK = 25; // 00:00'dan bu kadar önce başlamış parça artık çalmıyor sayılır
const SONRA_DK = 3; // 00:00'da çalan yoksa bu pencerede başlayan ilk şarkı
const HAZIR_DK = 5; // arşive düşmesi için gece yarısından sonra beklenen süre

export function istasyonDilimi(slug: string): string | null {
  const ozel = (dilimVeri as Record<string, string>)[slug];
  if (ozel) return ozel;
  const u = (ulkeVeri as Record<string, string>)[slug];
  if (!u) return null;
  return SAAT_DILIMI[u as UlkeKodu] ?? EK_DILIM[u] ?? null;
}

/** Saat diliminin o andaki UTC farkı (dakika). */
function fark(tz: string, t: number): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(t)).map((x) => [x.type, x.value])
  );
  const yerel = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((yerel - Math.floor(t / 1000) * 1000) / 60000);
}

/** Yerel tarih (YYYY-MM-DD) 00:00'ının UTC anı (ms). */
export function geceYarisiAni(tarih: string, tz: string): number {
  const [y, m, d] = tarih.split("-").map(Number);
  const saf = Date.UTC(y, m - 1, d);
  let t = saf - fark(tz, saf) * 60000;
  t = saf - fark(tz, t) * 60000; // yaz saati geçişine karşı ikinci tur
  return t;
}

type ArsivSatir = { slug: string; name: string; artist: string | null; title: string | null; raw_title: string | null; started_at: string };

async function arsivAn(ts: string): Promise<ArsivSatir[]> {
  // Bilerek Supabase'e düşmez: archive_at Supabase'te ağır, gece boyunca orayı yormayalım.
  const r = await fetch(`${ARSIV_URL}/rest/v1/rpc/archive_at`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ts }),
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`arsiv ${r.status}`);
  const d = await r.json();
  if (!Array.isArray(d)) throw new Error("arsiv biçim");
  return d as ArsivSatir[];
}

type Parca = { ad: string; artist: string | null; title: string | null; sonra: boolean };

// Yayın dolgusu: "offline - contact x@y", "sei sintonizzato su…", "{+info: …}" ekleri.
const DOLGU = /@|^\s*offline\b|sintonizzato|you('| a)re listening|şu an dinlediğiniz/i;
const ek = (t: string | null) => (t ? t.replace(/\s*\{\+?info:[^}]*\}/gi, "").trim() || null : null);

function parca(r: ArsivSatir | undefined, sonra: boolean): Parca | null {
  if (!r) return null;
  if (DOLGU.test(`${r.artist ?? ""} ${r.title ?? ""} ${r.raw_title ?? ""}`)) return null;
  let artist = ek(temizMetin(r.artist));
  let title = ek(temizMetin(r.title));
  if (!title && !artist) {
    const ham = temizMetin(r.raw_title);
    if (!ham) return null;
    title = ham;
  }
  if (artist && title && artist.toLowerCase() === title.toLowerCase()) artist = null; // "Özledim - Özledim"
  // Radyonun kendi adını basan yayın bilgisi şarkı değildir.
  const ad = r.name.toLowerCase();
  if (!artist && title && (title.toLowerCase() === ad || title.toLowerCase().startsWith(ad))) return null;
  return { ad: r.name, artist, title: title ? parcaAdi(title) : null, sonra };
}

/** Bir gece yarısı anı için radyo → parça. Kalıcı önbellek: geçmiş an değişmez. Hata önbelleğe girmez (fırlatır). */
async function anParcalari(anIso: string): Promise<Record<string, Parca>> {
  const an = Date.parse(anIso);
  const [once, sonra] = await Promise.all([
    arsivAn(new Date(an).toISOString()),
    arsivAn(new Date(an + SONRA_DK * 60000).toISOString()),
  ]);
  const sonraMap = new Map(sonra.map((r) => [r.slug, r]));
  const out: Record<string, Parca> = {};
  for (const r of once) {
    const bas = Date.parse(r.started_at);
    let p: Parca | null = null;
    if (bas >= an - ESKI_DK * 60000) p = parca(r, false);
    if (!p) {
      const s = sonraMap.get(r.slug);
      if (s && Date.parse(s.started_at) > an) p = parca(s, true);
    }
    if (p) out[r.slug] = p;
  }
  // 00:00'da hiç kaydı olmayan, 00:03'e kadar başlayan radyolar
  for (const s of sonra) {
    if (out[s.slug]) continue;
    if (Date.parse(s.started_at) > an) {
      const p = parca(s, true);
      if (p) out[s.slug] = p;
    }
  }
  return out;
}

const anParcalariC = unstable_cache(anParcalari, ["gece-yarisi-an-v3"], { revalidate: false, tags: ["gece-yarisi"] });

// Radyo şu an çalanın gösterilmesini istemediyse (meta_gizli) şarkı gösterilmez. Küçük, saatlik.
const gizliler = unstable_cache(
  async (): Promise<string[]> => {
    const { data, error } = await getSupabase().from("stations").select("slug").eq("meta_gizli", true);
    if (error) throw error;
    return (data ?? []).map((r: { slug: string }) => r.slug);
  },
  ["gece-yarisi-gizli"],
  { revalidate: 3600 }
);

// Gizli liste okunamazsa grup "okunamadı" görünür: gizli bir radyonun şarkısını yanlışlıkla basmaktansa.
const sehirAdi = (tz: string) => tz.split("/").pop()!.replace(/_/g, " ");
// Birden çok saat dilimine yayılan ülkelerde (ABD, Avustralya…) her yerin yanında şehir yazılır.
const COK_DILIMLI = new Set(Object.keys(dilimVeri).map((s) => (ulkeVeri as Record<string, string>)[s]));

/** izinli verilirse (App Store uygulaması, Apple 5.2.3) yalnız o radyolar: gruplar, yerler ve sayılar
 *  onlara göre kurulur; izinli radyosu olmayan saat dilimi grubu hiç oluşmaz. */
export async function geceYarisi(tarih: string, simdi = Date.now(), izinli: Set<string> | null = null): Promise<GyVeri> {
  // Katalogdaki radyolar, gece yarısı anına göre gruplanır.
  const gruplar = new Map<number, { yerler: Map<string, { ulke: string; sehir: string | null }>; radyolar: { slug: string; ulke: string; sehir: string | null }[] }>();
  for (const [slug, ulke] of Object.entries(ulkeVeri as Record<string, string>)) {
    if (izinli && !izinli.has(slug)) continue;
    const tz = istasyonDilimi(slug);
    if (!tz) continue;
    const an = geceYarisiAni(tarih, tz);
    const sehir = COK_DILIMLI.has(ulke) ? sehirAdi(tz) : null;
    let g = gruplar.get(an);
    if (!g) gruplar.set(an, (g = { yerler: new Map(), radyolar: [] }));
    g.yerler.set(`${ulke}|${sehir ?? ""}`, { ulke, sehir });
    g.radyolar.push({ slug, ulke, sehir });
  }

  let gizli: Set<string> | null = null;
  const sirali = [...gruplar.entries()].sort((a, b) => a[0] - b[0]);
  const sonuc: GyGrup[] = [];
  for (const [an, g] of sirali) {
    const yerler = [...g.yerler.values()].sort((a, b) => sira(a.ulke) - sira(b.ulke) || (a.sehir ?? "").localeCompare(b.sehir ?? ""));
    const temel = { an: new Date(an).toISOString(), yerler, istasyon: g.radyolar.length };
    if (simdi < an) { sonuc.push({ ...temel, durum: "bekliyor", satirlar: [] }); continue; }
    if (simdi < an + HAZIR_DK * 60000) { sonuc.push({ ...temel, durum: "hazirlaniyor", satirlar: [] }); continue; }
    try {
      if (!gizli) gizli = new Set(await gizliler());
      const p = await anParcalariC(temel.an);
      const satirlar: GySatir[] = [];
      for (const r of g.radyolar) {
        if (gizli.has(r.slug)) continue;
        const x = p[r.slug];
        if (!x) continue;
        satirlar.push({ slug: r.slug, ulke: r.ulke, sehir: r.sehir, ...x });
      }
      sonuc.push({ ...temel, durum: "hazir", satirlar });
    } catch (e) {
      console.warn("gece yarısı okunamadı:", temel.an, (e as Error).message);
      sonuc.push({ ...temel, durum: "okunamadi", satirlar: [] });
    }
  }
  return { tarih, simdi: new Date(simdi).toISOString(), gruplar: sonuc };
}

function sira(u: string): number {
  return (ULKELER as Record<string, { sira: number }>)[u]?.sira ?? 80;
}

/** Gösterilecek yeni yıl: Temmuz'dan itibaren gelecek yılbaşı, öncesinde geçen. */
export function guncelYil(simdi = Date.now()): number {
  const d = new Date(simdi);
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
}

/** İstek parametreleri → hangi gece. ?tarih=YYYY-MM-DD herhangi bir geçmiş gece (sınama ve meraklılar için),
 *  ?yil=2027 o yılbaşı; ikisi de yoksa güncel yılbaşı. ?simdi= yalnız yerel geliştirmede saati kaydırır. */
export function istekCoz(p: { tarih?: string | null; yil?: string | null; simdi?: string | null; gorunum?: string | null }) {
  const gelistirme = process.env.NODE_ENV !== "production";
  let simdi = Date.now();
  if (gelistirme && p.simdi && !Number.isNaN(Date.parse(p.simdi))) simdi = Date.parse(p.simdi);
  let tarih: string | null = null;
  let deneme = false;
  if (p.tarih && /^\d{4}-\d{2}-\d{2}$/.test(p.tarih) && !Number.isNaN(Date.parse(p.tarih))) {
    // Arşiv Ekim 2026'da başladı; gelecekteki geceler için de yalnız bir gün ilerisi.
    const t = Date.parse(p.tarih);
    if (t >= Date.UTC(2026, 9, 1) && t <= simdi + 2 * 864e5) { tarih = p.tarih; deneme = !p.tarih.endsWith("-01-01"); }
  }
  if (!tarih && p.yil && /^20\d\d$/.test(p.yil) && +p.yil >= 2027 && +p.yil <= guncelYil(simdi)) tarih = `${p.yil}-01-01`;
  if (!tarih) tarih = `${guncelYil(simdi)}-01-01`;
  // Yerelde, sıradan bir geceyi yılbaşı arşivi gibi göstermek için: ?gorunum=yil
  if (gelistirme && p.gorunum === "yil") deneme = false;
  return { tarih, simdi, deneme };
}

export function bitti(v: GyVeri): boolean {
  return v.gruplar.every((g) => g.durum === "hazir");
}
