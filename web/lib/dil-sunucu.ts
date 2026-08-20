import { cookies } from "next/headers";
import { ceviri, type Dil } from "./i18n-core";

// Sunucu bileşenlerinde dil: 'dil' çerezinden okunur (DilToggle yazar).
export async function dilSunucu(): Promise<Dil> {
  try {
    const c = await cookies();
    return c.get("dil")?.value === "en" ? "en" : "tr";
  } catch {
    return "tr";
  }
}

// Sunucuda çeviri: t = await ceviriSunucu();  t("anahtar")
export async function ceviriSunucu(): Promise<(anahtar: string) => string> {
  const dil = await dilSunucu();
  return (anahtar: string) => ceviri(dil, anahtar);
}
