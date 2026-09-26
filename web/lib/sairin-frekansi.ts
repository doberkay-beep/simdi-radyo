// Şairin Frekansı — Berkay'ın küratörlüğü: günün/haftanın istasyon seçkisi.
// Yeni seçki eklemek: en üste bir kayıt ekle (tarih, istasyon slug'ı, bir cümlelik not).
// Liste boşken köşe ana sayfada hiç görünmez. Notlar Berkay'ındır; onaysız eklenmez.

export type Secki = {
  tarih: string; // ISO, örn. "2026-09-26" — bu tarihten itibaren gösterilir
  slug: string;
  not: string;
};

export const SECKILER: Secki[] = [];

export function guncelSecki(): Secki | null {
  const bugun = new Date().toISOString().slice(0, 10);
  return SECKILER.find((s) => s.tarih <= bugun) ?? null;
}
