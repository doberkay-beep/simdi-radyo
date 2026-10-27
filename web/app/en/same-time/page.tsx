import type { Metadata } from "next";
import AyniAnda from "@/components/AyniAnda";
import { dunyaAnlari } from "@/lib/dunyaAnlari";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Same time — the same song, on different continents, within minutes | nowby.",
  description: "When unconnected radio stations on different continents play the same song within the same few minutes, nowby records the moment. The world's coincidences.",
  alternates: { canonical: "/en/same-time", languages: { tr: "/ayni-anda", en: "/en/same-time" } },
};

export default async function Page() {
  return <AyniAnda anlar={await dunyaAnlari(60)} dil="en" />;
}
