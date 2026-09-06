import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ULKELER, ULKE_SLUG, ulkeSlugEn } from "@/lib/ulkeler";
import UlkeSayfasi, { ulkeBaslik } from "@/components/UlkeSayfasi";

// Ülke merkez sayfası (TR) — "Almanya radyoları canlı" gibi aramalar + atlas gezgini.
export const revalidate = 600;

export function generateStaticParams() {
  return Object.keys(ULKE_SLUG).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const kod = ULKE_SLUG[slug];
  if (!kod) return { title: "Ülke bulunamadı — ŞİMDİ" };
  const u = ULKELER[kod];
  const baslik = ulkeBaslik(kod, "tr");
  return {
    title: `${baslik} — canlı dinle, şu an ne çalıyor | ŞİMDİ`,
    description: `${baslik}: seçme istasyonlar, tek tıkla canlı yayın ve şu an çalan parçalar. ${u.en} radio stations, live.`,
    alternates: {
      canonical: `/ulke/${slug}`,
      languages: {
        "tr": `/ulke/${slug}`,
        "en": `/en/country/${ulkeSlugEn(kod)}`,
        "x-default": `/ulke/${slug}`,
      },
    },
    openGraph: { title: `${baslik} — canlı`, description: `${u.en} radio, live — now playing.`, type: "website" },
  };
}

export default async function UlkePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kod = ULKE_SLUG[slug];
  if (!kod) notFound();
  return <UlkeSayfasi kod={kod} dil="tr" />;
}
