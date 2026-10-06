import type { Metadata } from "next";
import RaporGovde from "@/components/RaporGovde";
import { buHafta, raporGetir, haftaEtiketi } from "@/lib/rapor";

// Haftalık Türkiye Radyo Raporu — bu hafta (sürüyor). Veri günlük sayım tablosundan.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const h = buHafta();
  return {
    title: `Türkiye Radyo Raporu · ${haftaEtiketi(h)} | ŞİMDİ`,
    description: "Türkiye radyolarında bu hafta en çok çalan 20 şarkı, haftanın sanatçıları, yükselenler ve yeni girenler — 7/24 canlı sayımla.",
    alternates: { canonical: "/rapor" },
  };
}

export default async function Sayfa() {
  const h = buHafta();
  return <RaporGovde hafta={h} r={await raporGetir(h)} />;
}
