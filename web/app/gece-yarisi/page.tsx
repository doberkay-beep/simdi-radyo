import type { Metadata } from "next";
import GeceYarisi from "@/components/GeceYarisi";
import { geceYarisi, istekCoz } from "@/lib/gece-yarisi";
import { yilinKareleri } from "@/lib/yilin-kareleri";
import { yilaEk } from "@/lib/yil-ek";
import "../gece-yarisi.css";

// Yılbaşı gecesi: her radyoda yerel 00:00'da çalan şarkı. Gece boyunca dolar, sonra arşiv olarak kalır.
export const dynamic = "force-dynamic";

type Q = { tarih?: string; yil?: string; simdi?: string; gorunum?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Q> }): Promise<Metadata> {
  const { tarih, deneme } = istekCoz(await searchParams);
  const yil = tarih.slice(0, 4);
  return {
    title: deneme ? `Gece yarısı ne çalıyordu? ${tarih} | nowby.` : `Gece yarısı ne çalıyordu? ${yilaEk(+yil)} hangi şarkıyla girdik | nowby.`,
    description: `Yılbaşı gecesi, saat dilimi saat dilimi: dünyanın yüzlerce radyosunda yerel saatle 00:00'da çalan şarkı. Sydney'den Los Angeles'a, yeni yılın ilk dakikası.`,
    alternates: { canonical: "/gece-yarisi", languages: { tr: "/gece-yarisi", en: "/en/midnight" } },
    robots: deneme ? { index: false } : undefined,
  };
}

export default async function Sayfa({ searchParams }: { searchParams: Promise<Q> }) {
  const q = await searchParams;
  const { tarih, simdi, deneme } = istekCoz(q);
  const [veri, { kareler }] = await Promise.all([geceYarisi(tarih, simdi), yilinKareleri()]);
  const sorgu = new URLSearchParams(Object.entries({ tarih: q.tarih, yil: q.yil }).filter(([, v]) => v) as [string, string][]).toString();
  return <GeceYarisi ilk={veri} dil="tr" sorgu={sorgu} deneme={deneme} kareler={kareler} />;
}
