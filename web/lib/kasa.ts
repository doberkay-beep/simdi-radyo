"use client";

// HAFIZA KASASI — üyeliksiz yedek. Favoriler, müzik defteri ve takip edilen
// sanatçılar yalnız tarayıcıda yaşıyordu; tarayıcı temizlenince, iPhone'da
// ana ekran uygulamasıyla Safari arasında ya da başka bir adresten açılınca
// kayboluyordu. Artık 10 haneli bir kodla sunucuda da tutulur; kod başka
// cihazda girilince her şey geri gelir.

import { getSupabase } from "./supabase";

const KOD_ANAHTAR = "kasaKodu";
const SON_ANAHTAR = "kasaSonYedek";
// Kasaya giren defterler (localStorage anahtarları).
const DEFTERLER = ["favoriler", "avDefteri", "izlenenSanatcilar"] as const;
const ALFABE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // karışan 0/O, 1/I yok

export const KASA_OLAYI = "kasa-geri-yuklendi";

type Kasa = Partial<Record<(typeof DEFTERLER)[number], unknown[]>>;

function oku(anahtar: string): string | null {
  try { return localStorage.getItem(anahtar); } catch { return null; }
}
function yaz(anahtar: string, deger: string) {
  try { localStorage.setItem(anahtar, deger); } catch { /* yoksay */ }
}

function cerezKod(): string | null {
  const m = document.cookie.match(/(?:^|; )kasa=([A-Z2-9]{10})/);
  return m ? m[1] : null;
}
function cerezYaz(kod: string) {
  // Yerel depo silinse bile kod çerezde de dursun (yedeğin yedeği).
  document.cookie = `kasa=${kod}; max-age=34560000; path=/; samesite=lax; secure`;
}

export function kodGecerli(kod: string): boolean {
  return /^[A-Z2-9]{10}$/.test(kod.trim().toUpperCase());
}

// Bu tarayıcının kasa kodu — yoksa üretilir.
export function kasaKodu(): string {
  let kod = oku(KOD_ANAHTAR) || cerezKod();
  if (!kod || !kodGecerli(kod)) {
    const r = crypto.getRandomValues(new Uint8Array(10));
    kod = Array.from(r, (b) => ALFABE[b % ALFABE.length]).join("");
  }
  yaz(KOD_ANAHTAR, kod);
  cerezYaz(kod);
  return kod;
}

function topla(): Kasa {
  const k: Kasa = {};
  for (const d of DEFTERLER) {
    try {
      const v = JSON.parse(oku(d) || "[]");
      if (Array.isArray(v) && v.length) k[d] = v;
    } catch { /* bozuk defter atlanır */ }
  }
  return k;
}

function bosMu(k: Kasa): boolean {
  return !DEFTERLER.some((d) => (k[d]?.length ?? 0) > 0);
}

// Değişiklik varsa sunucuya yaz (aynı içeriği tekrar göndermez).
export async function kasaYedekle(): Promise<void> {
  const k = topla();
  if (bosMu(k)) return;
  const govde = JSON.stringify(k);
  if (oku(SON_ANAHTAR) === govde) return;
  const { error } = await getSupabase().rpc("kasa_yaz", { p_kod: kasaKodu(), p_veri: k });
  if (!error) yaz(SON_ANAHTAR, govde);
}

// İki listeyi birleştir: favoriler/takip = küme; müzik defteri = t'ye göre tekil.
function birlestir(d: (typeof DEFTERLER)[number], yerel: unknown[], uzak: unknown[]): unknown[] {
  if (d === "avDefteri") {
    const gorulen = new Set<number>();
    return [...yerel, ...uzak]
      .filter((a) => {
        const t = (a as { t?: number }).t ?? 0;
        if (gorulen.has(t)) return false;
        gorulen.add(t);
        return true;
      })
      .sort((a, b) => ((b as { t: number }).t ?? 0) - ((a as { t: number }).t ?? 0))
      .slice(0, 200);
  }
  const gorulen = new Set<string>();
  return [...yerel, ...uzak].filter((x) => {
    const anahtar = String(x).toLowerCase();
    if (gorulen.has(anahtar)) return false;
    gorulen.add(anahtar);
    return true;
  });
}

// Kodla geri yükle: sunucudakini yereldekiyle BİRLEŞTİRİR (hiçbir şey silinmez).
export async function kasaGeriYukle(kodHam: string): Promise<"tamam" | "yok" | "hata"> {
  const kod = kodHam.trim().toUpperCase();
  if (!kodGecerli(kod)) return "yok";
  const { data, error } = await getSupabase().rpc("kasa_oku", { p_kod: kod });
  if (error) return "hata";
  if (!data) return "yok";
  const uzak = data as Kasa;
  const yerel = topla();
  for (const d of DEFTERLER) {
    const b = birlestir(d, yerel[d] ?? [], uzak[d] ?? []);
    if (b.length) yaz(d, JSON.stringify(b));
  }
  yaz(KOD_ANAHTAR, kod);
  cerezYaz(kod);
  try { localStorage.removeItem(SON_ANAHTAR); } catch { /* yoksay */ }
  window.dispatchEvent(new Event(KASA_OLAYI));
  await kasaYedekle();
  return "tamam";
}

// Açılışta: yerel defterler boşsa ama bir kod biliniyorsa (çerezden), kasayı
// sessizce geri getir — kullanıcı hiçbir şey yapmadan favoriler döner.
export async function kasaAcilis(): Promise<void> {
  try { await navigator.storage?.persist?.(); } catch { /* destek yoksa geç */ }
  const kod = oku(KOD_ANAHTAR) || cerezKod();
  if (kod && bosMu(topla())) {
    await kasaGeriYukle(kod);
    return;
  }
  if (!bosMu(topla())) await kasaYedekle();
}
