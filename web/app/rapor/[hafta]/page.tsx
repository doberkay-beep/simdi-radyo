import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RaporGovde from "@/components/RaporGovde";
import { gecerliHafta, raporGetir, haftaEtiketi } from "@/lib/rapor";

export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ hafta: string }> }): Promise<Metadata> {
  const { hafta } = await params;
  if (!gecerliHafta(hafta)) return {};
  return {
    title: `Türkiye Radyo Raporu · ${haftaEtiketi(hafta)} | ŞİMDİ`,
    description: `${haftaEtiketi(hafta)} haftasında Türkiye radyolarında en çok çalan 20 şarkı ve sanatçılar.`,
    alternates: { canonical: `/rapor/${hafta}` },
  };
}

export default async function Sayfa({ params }: { params: Promise<{ hafta: string }> }) {
  const { hafta } = await params;
  if (!gecerliHafta(hafta)) notFound();
  return <RaporGovde hafta={hafta} r={await raporGetir(hafta)} />;
}
