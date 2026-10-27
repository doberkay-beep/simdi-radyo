import { getSupabase } from "./supabase";
import { ULKELER, SAAT_DILIMI, bayrakEmoji, type UlkeKodu } from "./ulkeler";

// Aynı anda — farklı kıtalarda aynı şarkının aynı dakikalarda çaldığı anlar (Hetzner arşivi,
// nöbetçi: sunucu/dunya-ani). Arşive ulaşılamazsa boş liste döner; sayfa sakin bir boş durum gösterir.
export type DunyaAni = {
  id: number;
  zaman: string;
  artist: string;
  title: string;
  ulkeler: string[];
  radyolar: { slug: string; ad: string; ulke: string; t: string }[];
};

export async function dunyaAnlari(adet = 60): Promise<DunyaAni[]> {
  const { data, error } = await getSupabase().rpc("dunya_anlari_liste", { adet });
  if (error || !Array.isArray(data)) return [];
  return data as DunyaAni[];
}

/** Her radyonun kendi ülkesindeki saati: "🇨🇴 Kolombiya 00:46". Saat dilimi bilinmiyorsa saat yazılmaz. */
export function yerelSaatler(an: DunyaAni, dil: "tr" | "en") {
  return [...an.radyolar].sort((a, b) => Date.parse(a.t) - Date.parse(b.t)).map((r) => {
    const k = r.ulke as UlkeKodu;
    const tz = SAAT_DILIMI[k];
    const saat = tz
      ? new Intl.DateTimeFormat(dil === "tr" ? "tr-TR" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(r.t))
      : null;
    return { bayrak: bayrakEmoji(k), ulke: ULKELER[k]?.[dil] ?? r.ulke.toUpperCase(), saat, radyo: r.ad };
  });
}

export function anTarihi(t: string, dil: "tr" | "en") {
  return new Intl.DateTimeFormat(dil === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(new Date(t));
}
