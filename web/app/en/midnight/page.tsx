import type { Metadata } from "next";
import GeceYarisi from "@/components/GeceYarisi";
import { geceYarisi, istekCoz } from "@/lib/gece-yarisi";
import "../../gece-yarisi.css";

// English twin of /gece-yarisi.
export const dynamic = "force-dynamic";

type Q = { tarih?: string; yil?: string; simdi?: string; gorunum?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Q> }): Promise<Metadata> {
  const { tarih, deneme } = istekCoz(await searchParams);
  const yil = tarih.slice(0, 4);
  return {
    title: deneme ? `What was playing at midnight? ${tarih} | nowby.` : `What was playing at midnight? The songs that played us into ${yil} | nowby.`,
    description: `New Year's Eve, one time zone at a time: the song on air at local 00:00 on hundreds of radio stations around the world. From Sydney to Los Angeles, the first minute of ${yil}.`,
    alternates: { canonical: "/en/midnight", languages: { tr: "/gece-yarisi", en: "/en/midnight" } },
    robots: deneme ? { index: false } : undefined,
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<Q> }) {
  const q = await searchParams;
  const { tarih, simdi, deneme } = istekCoz(q);
  const veri = await geceYarisi(tarih, simdi);
  const sorgu = new URLSearchParams(Object.entries({ tarih: q.tarih, yil: q.yil }).filter(([, v]) => v) as [string, string][]).toString();
  return <GeceYarisi ilk={veri} dil="en" sorgu={sorgu} deneme={deneme} />;
}
