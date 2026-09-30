// Türkiye Radyo Endeksi — ortak yardımcılar.
// Arşiv Ağustos 2026'da başladı; aylar TR takvimiyle sayılır.

export const ENDEKS_BASLANGIC = "2026-08";

export type EndeksListeSatiri = { artist: string; title: string; kez: number; istasyon: number };
export type EndeksOzet = {
  ay: string;
  devam: boolean;
  toplam: number;
  sanatci: { ad: string; kez: number } | null;
  liste: EndeksListeSatiri[];
};

// TR saatiyle "YYYY-MM".
export function suankiAy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit",
  }).format(new Date());
}

// Başlangıçtan bugüne aylar, yeniden eskiye.
export function endeksAylari(): string[] {
  const aylar: string[] = [];
  const [by, bm] = ENDEKS_BASLANGIC.split("-").map(Number);
  const [sy, sm] = suankiAy().split("-").map(Number);
  for (let y = by, m = bm; y < sy || (y === sy && m <= sm); m === 12 ? (y++, m = 1) : m++) {
    aylar.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return aylar.reverse();
}

export function ayAdi(ay: string, dil: "tr" | "en" = "tr"): string {
  const [y, m] = ay.split("-").map(Number);
  return new Intl.DateTimeFormat(dil === "en" ? "en-GB" : "tr-TR", {
    month: "long", year: "numeric", timeZone: "Europe/Istanbul",
  }).format(new Date(Date.UTC(y, m - 1, 15)));
}
