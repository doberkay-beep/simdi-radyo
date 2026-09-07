import { cookies, headers } from "next/headers";
import { ceviri, type Dil } from "./i18n-core";

// Sunucu bileşenlerinde dil: önce 'dil' çerezi (DilToggle yazar); çerez yoksa
// Accept-Language'a bakılır — tarayıcısı Türkçe olmayan ziyaretçi İngilizce karşılanır.
export async function dilSunucu(): Promise<Dil> {
  try {
    const c = await cookies();
    const v = c.get("dil")?.value;
    if (v === "en") return "en";
    if (v === "tr") return "tr";
    const h = await headers();
    const ilk = (h.get("accept-language") || "").split(",")[0].trim().toLowerCase();
    if (!ilk) return "tr";
    return ilk.startsWith("tr") ? "tr" : "en";
  } catch {
    return "tr";
  }
}

// Sunucuda çeviri: t = await ceviriSunucu();  t("anahtar")
export async function ceviriSunucu(): Promise<(anahtar: string) => string> {
  const dil = await dilSunucu();
  return (anahtar: string) => ceviri(dil, anahtar);
}
