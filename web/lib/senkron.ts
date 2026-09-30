import { getSupabase } from "./supabase";

// Senkron Anları — sunucu tarafı okuma yardımcıları (sayfalar + kart).
export type SenkronKayit = {
  id: number;
  artist: string;
  title: string;
  istasyonlar: { slug: string; name: string; t: string }[];
  sayi: number;
  ilk: string;
  son: string;
};

const ALANLAR = "id, artist, title, istasyonlar, sayi, ilk, son";

export async function senkronAl(id: number): Promise<SenkronKayit | null> {
  if (!Number.isFinite(id)) return null;
  const { data } = await getSupabase().from("senkron_anlari").select(ALANLAR).eq("id", id).maybeSingle();
  return (data as SenkronKayit | null) ?? null;
}

export async function senkronDefteri(adet = 40): Promise<SenkronKayit[]> {
  const { data } = await getSupabase().from("senkron_anlari").select(ALANLAR).order("son", { ascending: false }).limit(adet);
  return (data as SenkronKayit[] | null) ?? [];
}

export async function senkronRekoru(): Promise<SenkronKayit | null> {
  const { data } = await getSupabase().from("senkron_anlari").select(ALANLAR)
    .order("sayi", { ascending: false }).order("son", { ascending: true }).limit(1);
  return (data?.[0] as SenkronKayit | undefined) ?? null;
}

// "4 dk içinde" gibi yayılma süresi.
export function yayilma(an: SenkronKayit): string {
  const sn = Math.max(0, Math.round((Date.parse(an.son) - Date.parse(an.ilk)) / 1000));
  if (sn < 60) return `${sn} saniye içinde`;
  const dk = Math.floor(sn / 60), kalan = sn % 60;
  return kalan ? `${dk} dk ${kalan} sn içinde` : `${dk} dakika içinde`;
}

export function trZaman(t: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul",
  }).format(new Date(t));
}
