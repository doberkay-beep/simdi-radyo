// Çöp metadata süzgeci — bazı istasyonlar parça yerine URL, reklam ya da
// ham XML/HTML döndürür; bunlar hiçbir yüzeyde "çalan parça" olarak basılmaz.
export const COP_PARCA = /use http|www\.|https?:|\.com|\.net\b|^\s*<|<\?xml|<[a-z!/][^>]*>|now playing info|\bjingle\b(?!\s*(bell|all the way))|\breklam\b/i;

// Listelerde yayın dolgusu şarkı gibi görünmesin. Kayıtlara dokunmaz, yalnız gösterimi süzer.
export function gercekParca(s: { artist?: string | null; title?: string | null }): boolean {
  return !COP_PARCA.test(`${s.artist ?? ""} ${s.title ?? ""}`);
}

// Aylık özet: dolgu satırları çıkar; zirvedeki sanatçı dolguysa listeden yeniden bulunur.
export function ozetSuz<T extends { sanatci: { ad: string; kez: number } | null; liste: { artist: string; title: string; kez: number }[] }>(o: T): T {
  const liste = o.liste.filter(gercekParca);
  let sanatci = o.sanatci;
  if (sanatci && COP_PARCA.test(sanatci.ad)) {
    const say = new Map<string, number>();
    for (const s of liste) say.set(s.artist, (say.get(s.artist) ?? 0) + s.kez);
    const bas = [...say.entries()].sort((a, b) => b[1] - a[1])[0];
    sanatci = bas ? { ad: bas[0], kez: bas[1] } : null;
  }
  return { ...o, liste, sanatci };
}

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

