import type { Metadata } from "next";
import Liste from "@/components/Liste";
import { ULKELER, doluUlkeler, ulkeIstasyonSluglari, type UlkeKodu } from "@/lib/ulkeler";

// Başlık ve açıklama seçili ülkeye göre (/liste?ulke=jp); parametresiz sayfa Türkiye ve dünya için genel başlığı taşır.
const DOLU = doluUlkeler();
const TOPLAM = DOLU.reduce((t, k) => t + ulkeIstasyonSluglari(k).length, 0);
const ULKE_SAYISI = DOLU.filter((k) => k !== "www").length;

export async function generateMetadata({ searchParams }: PageProps<"/liste">): Promise<Metadata> {
  const u = (await searchParams).ulke;
  const k = typeof u === "string" ? u.toLowerCase() : "";

  if (k === "hepsi") {
    return {
      title: "nowby. LİSTESİ — Dünyanın radyolarında en çok çalanlar",
      description: `${ULKE_SAYISI} ülkeden ${TOPLAM} radyonun canlı yayın arşivinden sayım: bugün ve bu hafta dünyada en çok çalan şarkılar.`,
      alternates: { canonical: "/liste?ulke=hepsi" },
    };
  }
  if (k && k !== "tr" && (DOLU as string[]).includes(k)) {
    const ad = ULKELER[k as UlkeKodu].tr;
    const n = ulkeIstasyonSluglari(k as UlkeKodu).length;
    return {
      title: `nowby. LİSTESİ — ${ad} radyolarında en çok çalanlar`,
      description: `${ad} radyolarında gerçekte en çok çalan şarkılar: ${n} istasyonun canlı yayın arşivinden saat saat sayım.`,
      alternates: { canonical: `/liste?ulke=${k}` },
    };
  }
  return {
    title: "nowby. LİSTESİ — Türkiye'nin ve dünyanın radyolarında en çok çalanlar",
    description: `Radyolarda gerçekte en çok çalan şarkılar: Türkiye ve ${ULKE_SAYISI - 1} ülkeden ${TOPLAM} istasyonun canlı yayın arşivinden saat saat sayım. Ülke seç, sanatçını ara: bu hafta kaç kez çaldı?`,
    alternates: { canonical: "/liste" },
  };
}

export default function Page() {
  return <Liste />;
}
