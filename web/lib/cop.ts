// Çöp metadata süzgeci — bazı istasyonlar parça yerine URL, reklam ya da
// ham XML/HTML döndürür; bunlar hiçbir yüzeyde "çalan parça" olarak basılmaz.
export const COP_PARCA = /use http|www\.|https?:|\.com|\.net\b|^\s*<|<\?xml|<[a-z!/][^>]*>|now playing info/i;

export function temizMetin(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const s = t.trim();
  if (!s || COP_PARCA.test(s)) return null;
  return s;
}
