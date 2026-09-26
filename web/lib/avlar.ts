// Şarkı Yakala — av defteri + izlenen sanatçılar (yalnız bu tarayıcıda).

export type Av = {
  t: number; // yakalanma anı (aynı zamanda kimlik)
  artist: string | null;
  title: string | null;
  slug: string;
  istasyon: string;
};

const AV_ANAHTAR = "avDefteri";
const IZLE_ANAHTAR = "izlenenSanatcilar";

export function avOku(): Av[] {
  try {
    return JSON.parse(localStorage.getItem(AV_ANAHTAR) || "[]") as Av[];
  } catch {
    return [];
  }
}

export function avEkle(av: Av): Av[] {
  const mevcut = avOku();
  // Aynı parçayı üst üste yakalamayı tekilleştir.
  const son = mevcut[0];
  if (son && son.slug === av.slug && son.artist === av.artist && son.title === av.title) {
    return mevcut;
  }
  const yeni = [av, ...mevcut].slice(0, 200);
  try {
    localStorage.setItem(AV_ANAHTAR, JSON.stringify(yeni));
  } catch { /* yoksay */ }
  return yeni;
}

export function avSil(t: number): Av[] {
  const yeni = avOku().filter((a) => a.t !== t);
  try {
    localStorage.setItem(AV_ANAHTAR, JSON.stringify(yeni));
  } catch { /* yoksay */ }
  return yeni;
}

export function avTemizle(): void {
  try {
    localStorage.removeItem(AV_ANAHTAR);
  } catch { /* yoksay */ }
}

export function izlenenOku(): string[] {
  try {
    return JSON.parse(localStorage.getItem(IZLE_ANAHTAR) || "[]") as string[];
  } catch {
    return [];
  }
}

export function izlenenDegistir(sanatci: string): string[] {
  const ad = sanatci.trim();
  if (!ad) return izlenenOku();
  const mevcut = izlenenOku();
  const yeni = mevcut.some((x) => x.toLowerCase() === ad.toLowerCase())
    ? mevcut.filter((x) => x.toLowerCase() !== ad.toLowerCase())
    : [...mevcut, ad].slice(0, 50);
  try {
    localStorage.setItem(IZLE_ANAHTAR, JSON.stringify(yeni));
  } catch { /* yoksay */ }
  return yeni;
}

export function izleniyorMu(izlenenler: string[], sanatci: string | null): boolean {
  if (!sanatci) return false;
  const ad = sanatci.trim().toLowerCase();
  return izlenenler.some((x) => x.toLowerCase() === ad);
}
