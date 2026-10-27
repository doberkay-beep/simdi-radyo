import type { Metadata } from "next";
import AyniAnda from "@/components/AyniAnda";
import { dunyaAnlari } from "@/lib/dunyaAnlari";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Aynı anda — farklı kıtalarda, aynı dakikalarda aynı şarkı | nowby.",
  description: "Birbirinden habersiz radyolar, farklı kıtalarda, aynı dakikalarda aynı şarkıyı çaldığında nowby o anı kaydediyor. Dünyanın rastlantıları.",
  alternates: { canonical: "/ayni-anda", languages: { tr: "/ayni-anda", en: "/en/same-time" } },
};

export default async function Sayfa() {
  return <AyniAnda anlar={await dunyaAnlari(60)} dil="tr" />;
}
