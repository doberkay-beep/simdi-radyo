import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ULKELER, ULKE_SLUG_EN, ulkeSlug } from "@/lib/ulkeler";
import UlkeSayfasi, { ulkeBaslik } from "@/components/UlkeSayfasi";

// Country hub page (EN) — international long-tail: "germany radio live" etc.
export const revalidate = 600;

export function generateStaticParams() {
  return Object.keys(ULKE_SLUG_EN).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const kod = ULKE_SLUG_EN[slug];
  if (!kod) return { title: "Country not found — ŞİMDİ" };
  const u = ULKELER[kod];
  const baslik = ulkeBaslik(kod, "en");
  return {
    title: `${baslik} — listen live, now playing | ŞİMDİ`,
    description: `${baslik}: hand-picked stations, one-tap live streams and what's playing right now in ${u.en}.`,
    alternates: {
      canonical: `/en/country/${slug}`,
      languages: {
        "tr": `/ulke/${ulkeSlug(kod)}`,
        "en": `/en/country/${slug}`,
        "x-default": `/ulke/${ulkeSlug(kod)}`,
      },
    },
    openGraph: { title: `${baslik} — live`, description: `${u.en} radio, live — now playing.`, type: "website" },
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kod = ULKE_SLUG_EN[slug];
  if (!kod) notFound();
  return <UlkeSayfasi kod={kod} dil="en" />;
}
