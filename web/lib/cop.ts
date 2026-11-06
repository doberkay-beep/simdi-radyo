// Çöp metadata süzgeci — bazı istasyonlar parça yerine URL, reklam ya da
// ham XML/HTML döndürür; bunlar hiçbir yüzeyde "çalan parça" olarak basılmaz.
export const COP_PARCA = /use http|www\.|https?:|\.com|\.net\b|^\s*<|<\?xml|<[a-z!/][^>]*>|now playing info/i;

export function temizMetin(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const s = t.trim();
  if (!s || COP_PARCA.test(s)) return null;
  return s;
}

// Yayın bilgisindeki video eklerini ve kopuk başlangıçları yalnız ekranda temizler.
const VIDEO_EKI = /\s*[([][^)\]]*(official|resmi|video|visuali[sz]er|lyric|audio|klip|remaster|hd\b)[^)\]]*[)\]]/gi;
export function parcaAdi(t: string | null | undefined): string {
  if (!t) return "";
  const s = t.replace(VIDEO_EKI, "").replace(/\s*[-–|]\s*(official|resmi)\b.*$/i, "").replace(/^\s*(x|&|ft\.?|feat\.?)\s+/i, "").trim();
  return s || t.trim();
}

