import type { Metadata } from "next";
import Liste from "@/components/Liste";
import { ULKELER, doluUlkeler, ulkeIstasyonSluglari, type UlkeKodu } from "@/lib/ulkeler";

// nowby. CHART (EN) — the same live count as /liste, opening on the world list.
// Title and description follow ?ulke= (e.g. /en/chart?ulke=jp).
const DOLU = doluUlkeler();
const TOPLAM = DOLU.reduce((t, k) => t + ulkeIstasyonSluglari(k).length, 0);
const ULKE_SAYISI = DOLU.filter((k) => k !== "www").length;

export async function generateMetadata({ searchParams }: PageProps<"/en/chart">): Promise<Metadata> {
  const u = (await searchParams).ulke;
  const k = typeof u === "string" ? u.toLowerCase() : "";

  if (k && k !== "hepsi" && (DOLU as string[]).includes(k)) {
    const ad = k === "tr" ? "Türkiye" : ULKELER[k as UlkeKodu].en;
    const n = ulkeIstasyonSluglari(k as UlkeKodu).length;
    const tr = k === "tr" ? "/liste" : `/liste?ulke=${k}`;
    return {
      title: `nowby. CHART — most played on the radio in ${ad}`,
      description: `The songs really playing most on the radio in ${ad}, counted live from the broadcast archive of ${n} stations.`,
      alternates: { canonical: `/en/chart?ulke=${k}`, languages: { tr, en: `/en/chart?ulke=${k}` } },
    };
  }
  return {
    title: "nowby. CHART — most played on the world's radio right now",
    description: `The songs really playing most on the radio, counted live from ${TOPLAM} stations in ${ULKE_SAYISI} countries. Pick a country: Japan, Brazil, the United States, Türkiye…`,
    alternates: { canonical: "/en/chart", languages: { tr: "/liste?ulke=hepsi", en: "/en/chart" } },
    openGraph: { title: "nowby. CHART", description: "What's really playing on the world's radio — counted live.", type: "website" },
  };
}

export default function ChartPageEn() {
  return <Liste dil="en" />;
}
