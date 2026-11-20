// Çöp metadata süzgeci — bazı istasyonlar parça yerine URL, reklam ya da
// ham XML/HTML döndürür; bunlar hiçbir yüzeyde "çalan parça" olarak basılmaz.
export const COP_PARCA = /use http|www\.|https?:|\.com|\.net\b|^\s*<|<\?xml|<[a-z!/][^>]*>|now playing info|(^|[^a-zçğıöşü])j[iı]ngles?\b(?!\s*(bell|all the way))|\breklam(lar)?\b/i;

// Listelerde yayın dolgusu şarkı gibi görünmesin. Kayıtlara dokunmaz, yalnız gösterimi süzer.
export function gercekParca(s: { artist?: string | null; title?: string | null }): boolean {
  return !COP_PARCA.test(`${s.artist ?? ""} ${s.title ?? ""}`);
}

// Yalnız LİSTELER için ek süzgeç (20 Kas): radyoların reklam/program kuşaklarını şarkı gibi sayan kayıtlar —
// telefon numarası ("0331593377 - 0", "0331 45 21 83 - 0") ya da başlıkta site adı ("…di 70-80.it - 2022"), " - 0" ile biten reklam kuşakları ve alt çizgili reklam kodları ("187683_RGI_ANI_20_…"). Çalan şarkı gösteriminde
// kullanılmaz: orada adında kimlik ya da site geçen gerçek şarkılar var ("Couci Couca §2973505").
const LISTE_COP = /\d{7,}|\s-\s0\s*$|[A-Za-z0-9]+_[A-Za-z0-9]+_[A-Za-z0-9]+|(^|\s)0\d{2,3}[\s.]\d{2,3}[\s.]\d{2}[\s.]?\d{2}\b|\b[\w-]+\.(it|de|fr|es|nl|pl|ru|tr|fm|eu|org|info|uk|co)\b(?!\.)/i;
// 70 80 Hits HQ / NBC Milano (aynı yayın) program kuşaklarını "sanatçı — başlık - yıl" diye gönderiyor
// ("Dieci di noi — Le canzoni che ci somigliano - 2026"). Gerçek şarkılarına da yıl eklediği için genel kural
// olmaz; programlar BAŞLIKLARIYLA tek tek (sanatçı adı "Behind", "Neverland" gibi gerçek adlarla karışmasın).
const PROGRAM = /^(le canzoni che ci somigliano|un artista in tre brani|dietro le storie della musica|we mix again|du gusti is megl che one|settantaxottanta\b.*|dieci over the top à la carte)(\s-\s(19|20)\d\d)?\s*$/i;
export function listeParcasi(s: { artist?: string | null; title?: string | null }): boolean {
  return gercekParca(s) && !LISTE_COP.test(`${s.artist ?? ""} ${s.title ?? ""}`) && !PROGRAM.test((s.title ?? "").trim());
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

// Sanatçı adresi yayın dolgusu mu ("jingle", "10-00-reklam")?
export const DOLGU_SLUG = /(^|-)(jingle|reklam)(-|$)/;
