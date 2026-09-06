import type { Metadata } from "next";
import Link from "next/link";
import { ULKELER, ulkeSlugEn, bayrakUrl, doluUlkeler, ulkeIstasyonSluglari, SAAT_DILIMI } from "@/lib/ulkeler";
import YerelSaat from "@/components/YerelSaat";
import DunyaHaritasi from "@/components/DunyaHaritasi";

// World Atlas (EN) — radio by country.
export const metadata: Metadata = {
  title: "World Atlas — live radio by country | ŞİMDİ",
  description: "From Turkey to Japan, Brazil to Sweden: hand-picked radio stations by country, one-tap live streams and what's playing right now.",
  alternates: {
    canonical: "/en/countries",
    languages: { "tr": "/ulke", "en": "/en/countries", "x-default": "/ulke" },
  },
  openGraph: { title: "World Atlas — ŞİMDİ", description: "Live radio by country — now playing.", type: "website" },
};

export default function AtlasPageEn() {
  const ulkeler = doluUlkeler();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "World Atlas — ŞİMDİ",
    url: "https://necaliyor.co/en/countries",
    inLanguage: "en",
    hasPart: ulkeler.map((k) => ({
      "@type": "WebPage",
      name: `${ULKELER[k].en} Radio Stations`,
      url: `https://necaliyor.co/en/country/${ulkeSlugEn(k)}`,
    })),
  };

  return (
    <div className="spread min-h-screen" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
            ← now
          </Link>
          <span className="flex items-center gap-3">
            <Link href="/ulke" className="text-xs underline" style={{ color: "var(--muted)" }}>TR</Link>
            <Link href="/" className="brand text-sm font-bold tracking-tight">ŞİMDİ</Link>
          </span>
        </header>

        <h1 className="brand text-4xl font-bold tracking-tight">World Atlas</h1>
        <p className="epigraf mt-3 text-[15px]">
          Every country has a &ldquo;now&rdquo;. Tap a light; tune into that country&rsquo;s frequencies.
        </p>

        <div className="mt-6">
          <DunyaHaritasi dil="en" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ulkeler.map((k) => {
            const b = bayrakUrl(k);
            const n = ulkeIstasyonSluglari(k).length;
            return (
              <Link
                key={k}
                href={`/en/country/${ulkeSlugEn(k)}`}
                className="press flex items-center gap-3 rounded-2xl border p-4"
                style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--fg) 3%, transparent)" }}
              >
                {b ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b} alt="" width={32} height={24} className="rounded-[3px] border" style={{ borderColor: "var(--line)" }} loading="lazy" />
                ) : (
                  <span className="text-2xl" aria-hidden>🌐</span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{ULKELER[k].en}</span>
                  <span className="block text-xs" style={{ color: "var(--muted)" }}>
                    {n} stations
                    {SAAT_DILIMI[k] && <> · <YerelSaat tz={SAAT_DILIMI[k]!} dil="en" /></>}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
