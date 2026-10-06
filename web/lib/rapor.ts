// Haftalık Türkiye Radyo Raporu — yardımcılar. Veri: hafta_raporu(p_bas) RPC (rapor.sql).
import { getSupabase } from "./supabase";

export type RaporSarki = { artist: string; title: string; kez: number; istasyon?: number; sira?: number; onceki_sira?: number | null; onceki?: number };
export type Rapor = {
  bas: string;
  bit: string;
  gun_sayisi: number;
  onceki_var: boolean;
  liste_calma: number;
  ilk20: RaporSarki[];
  sanatcilar: { ad: string; kez: number; sarki: number }[];
  yukselen: RaporSarki[];
  yeni: RaporSarki[];
};

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const ILK_HAFTA = "2026-09-28"; // günlük sayım 1 Ekim 2026'da başladı

// İstanbul'a göre bugünün haftasının pazartesisi (YYYY-MM-DD)
export function buHafta(): string {
  const tr = new Date(Date.now() + 3 * 3600e3); // UTC+3 (Türkiye yaz saati yok)
  const gun = (tr.getUTCDay() + 6) % 7; // pazartesi = 0
  tr.setUTCDate(tr.getUTCDate() - gun);
  return tr.toISOString().slice(0, 10);
}

export function haftalar(): string[] {
  const out: string[] = [];
  const son = buHafta();
  for (let d = new Date(ILK_HAFTA + "T00:00:00Z"); d.toISOString().slice(0, 10) <= son; d.setUTCDate(d.getUTCDate() + 7)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out.reverse();
}

export function gecerliHafta(h: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(h) && haftalar().includes(h);
}

export function haftaEtiketi(bas: string): string {
  const b = new Date(bas + "T00:00:00Z");
  const s = new Date(b); s.setUTCDate(s.getUTCDate() + 6);
  const ba = AYLAR[b.getUTCMonth()], sa = AYLAR[s.getUTCMonth()];
  return ba === sa
    ? `${b.getUTCDate()}–${s.getUTCDate()} ${sa} ${s.getUTCFullYear()}`
    : `${b.getUTCDate()} ${ba} – ${s.getUTCDate()} ${sa} ${s.getUTCFullYear()}`;
}

export async function raporGetir(bas: string): Promise<Rapor | null> {
  try {
    const { data, error } = await getSupabase().rpc("hafta_raporu", { p_bas: bas });
    if (error || !data) return null;
    const r = data as Rapor;
    return r.gun_sayisi > 0 ? r : null;
  } catch {
    return null;
  }
}
