// Rozetler — dinleme başarımları. Tamamı tarayıcıdaki verilerden hesaplanır
// (dinleme günlüğü, av defteri, gece nöbeti günleri); hiçbir yere gönderilmez.

import { istasyonUlkesi } from "./ulkeler";

export type Rozet = {
  id: string;
  emoji: string;
  ad: { tr: string; en: string };
  aciklama: { tr: string; en: string };
};

export const ROZETLER: Rozet[] = [
  { id: "ilk-dinleme", emoji: "📻", ad: { tr: "İlk Frekans", en: "First Frequency" }, aciklama: { tr: "İlk istasyonunu dinledin.", en: "You listened to your first station." } },
  { id: "ilk-av", emoji: "🎣", ad: { tr: "İlk Av", en: "First Catch" }, aciklama: { tr: "İlk şarkını yakaladın.", en: "You caught your first song." } },
  { id: "kadran-gezgini", emoji: "🧭", ad: { tr: "Kadran Gezgini", en: "Dial Wanderer" }, aciklama: { tr: "10 farklı istasyon dinledin.", en: "You listened to 10 different stations." } },
  { id: "dunya-turu", emoji: "🌍", ad: { tr: "Dünya Turu", en: "World Tour" }, aciklama: { tr: "5 farklı ülkeden radyo dinledin.", en: "You tuned into radios from 5 countries." } },
  { id: "gece-nobetcisi", emoji: "🌙", ad: { tr: "Gece Nöbetçisi", en: "Night Warden" }, aciklama: { tr: "3 ayrı gece 02–05 nöbetine katıldın.", en: "You held the 2–5 AM watch on 3 nights." } },
  { id: "sadik-frekans", emoji: "❤️", ad: { tr: "Sadık Frekans", en: "Loyal Frequency" }, aciklama: { tr: "Aynı istasyonu 20 kez dinledin.", en: "You listened to one station 20 times." } },
  { id: "usta-avci", emoji: "🏹", ad: { tr: "Usta Avcı", en: "Master Hunter" }, aciklama: { tr: "10 şarkı yakaladın.", en: "You caught 10 songs." } },
  { id: "yuz-dinleme", emoji: "💯", ad: { tr: "Yüzler Kulübü", en: "Century Club" }, aciklama: { tr: "100 dinlemeye ulaştın.", en: "You reached 100 listens." } },
];

function oku<T>(anahtar: string, bos: T): T {
  try {
    return JSON.parse(localStorage.getItem(anahtar) || "") as T;
  } catch {
    return bos;
  }
}

// Gece nöbeti günü işaretle (GeceNobeti aktifken günde bir kez çağrılır).
export function nobetIsaretle(): void {
  try {
    const gunler = oku<string[]>("nobetGunleri", []);
    const bugun = new Date().toISOString().slice(0, 10);
    if (!gunler.includes(bugun)) {
      localStorage.setItem("nobetGunleri", JSON.stringify([...gunler, bugun].slice(-90)));
    }
  } catch { /* yoksay */ }
}

export function rozetleriHesapla(): Set<string> {
  const gunluk = oku<{ s: string; t: number }[]>("dinlemeGunlugu", []);
  const avlar = oku<unknown[]>("avDefteri", []);
  const nobetler = oku<string[]>("nobetGunleri", []);

  const istasyonSay = new Map<string, number>();
  const ulkeler = new Set<string>();
  for (const k of gunluk) {
    istasyonSay.set(k.s, (istasyonSay.get(k.s) || 0) + 1);
    const u = istasyonUlkesi(k.s);
    if (u) ulkeler.add(u);
  }
  const enCok = Math.max(0, ...istasyonSay.values());

  const kazanildi = new Set<string>();
  if (gunluk.length >= 1) kazanildi.add("ilk-dinleme");
  if (avlar.length >= 1) kazanildi.add("ilk-av");
  if (istasyonSay.size >= 10) kazanildi.add("kadran-gezgini");
  if (ulkeler.size >= 5) kazanildi.add("dunya-turu");
  if (nobetler.length >= 3) kazanildi.add("gece-nobetcisi");
  if (enCok >= 20) kazanildi.add("sadik-frekans");
  if (avlar.length >= 10) kazanildi.add("usta-avci");
  if (gunluk.length >= 100) kazanildi.add("yuz-dinleme");
  return kazanildi;
}
