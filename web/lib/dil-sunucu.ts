import { cookies, headers } from "next/headers";
import { ceviri, sozlukYukle, tabanDil, yerelGecerli, yerelSec, type Dil } from "./i18n-core";

// Sunucu bileşenlerinde dil: önce 'dil' çerezi (DilToggle yazar); çerez yoksa
// Accept-Language'a bakılır — tarayıcısı Türkçe olmayan ziyaretçi İngilizce karşılanır.
export async function dilSunucu(): Promise<Dil> {
  return tabanDil(await yerelSunucu());
}

// Yerel dil (SOZLUK çevirileri için): çerez, yoksa Accept-Language listesi.
export async function yerelSunucu(): Promise<string> {
  try {
    const c = await cookies();
    const v = c.get("dil")?.value;
    if (yerelGecerli(v)) return v;
    const h = await headers();
    const al = h.get("accept-language") || "";
    if (!al.trim()) return "tr";
    return yerelSec(al.split(","));
  } catch {
    return "tr";
  }
}

// Sunucuda çeviri: t = await ceviriSunucu();  t("anahtar")
export async function ceviriSunucu(): Promise<(anahtar: string) => string> {
  const yerel = await yerelSunucu();
  await sozlukYukle(yerel);
  return (anahtar: string) => ceviri(yerel, anahtar);
}
