import type { Metadata } from "next";
import Link from "next/link";
import { ULKELER, ulkeSlug, ulkeSlugEn, bayrakUrl, doluUlkeler, ulkeIstasyonSluglari, SAAT_DILIMI } from "@/lib/ulkeler";
import YerelSaat from "@/components/YerelSaat";
import DunyaHaritasi from "@/components/DunyaHaritasi";
import { dilSunucu } from "@/lib/dil-sunucu";

// Dünya Atlası — ülke ülke radyo gezgini.
export const metadata: Metadata = {
  title: "Dünya Atlası — ülke ülke canlı radyo | ŞİMDİ",
  description: "Türkiye'den Japonya'ya, Brezilya'dan İsveç'e: ülke ülke seçme radyolar, tek tıkla canlı yayın ve şu an çalan parçalar. World radio by country, live.",
  alternates: {
    canonical: "/ulke",
    languages: { "tr": "/ulke", "en": "/en/countries", "x-default": "/ulke" },
  },
  openGraph: { title: "Dünya Atlası — ŞİMDİ", description: "Ülke ülke canlı radyo. World radio by country.", type: "website" },
};

export default async function AtlasPage() {
  const dil = await dilSunucu();
  const en = dil === "en";
  const ulkeler = doluUlkeler();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Dünya Atlası — ŞİMDİ",
    url: "https://necaliyor.co/ulke",
    hasPart: ulkeler.map((k) => ({
      "@type": "WebPage",
      name: `${ULKELER[k].tr} Radyoları`,
      url: `https://necaliyor.co/ulke/${ulkeSlug(k)}`,
    })),
  };

  return (
    <div className="spread min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
            {en ? "← now" : "← şimdi"}
          </Link>
          <Link href="/" className="brand text-sm font-bold tracking-tight">ŞİMDİ</Link>
        </header>

        {/* Bant seçici — Dünya aktif */}
        <nav className="bandsel mb-6" aria-label="bant">
          <Link href="/" data-on="0">FM<span className="sub">{en ? "turkey" : "türkiye"}</span></Link>
          <Link href="/ulke" data-on="1" aria-current="page">{en ? "World" : "Dünya"}<span className="sub">atlas</span></Link>
          <Link href="/nabiz" data-on="0">{en ? "Pulse" : "Nabız"}<span className="sub">{en ? "live" : "canlı"}</span></Link>
        </nav>

        <h1 className="dial text-5xl uppercase tracking-[0.02em]" style={{ fontWeight: 500 }}>
          {en ? "World Atlas" : "Dünya Atlası"}
        </h1>
        <p className="epigraf mt-3 text-[15px]">
          {en
            ? "Every country has a “now”. Tap a light; tune into that country’s frequencies."
            : "Her ülkenin bir “şimdi”'si var. Bir ışığa dokun; o ülkenin frekanslarına bağlan."}
        </p>

        <div className="mt-6">
          <DunyaHaritasi dil={dil} />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ulkeler.map((k) => {
            const b = bayrakUrl(k);
            const n = ulkeIstasyonSluglari(k).length;
            return (
              <Link
                key={k}
                href={en ? `/en/country/${ulkeSlugEn(k)}` : `/ulke/${ulkeSlug(k)}`}
                className="surf press flex items-center gap-3 p-4"
              >
                {b ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b} alt="" width={32} height={24} className="rounded-[3px] border" style={{ borderColor: "var(--line)" }} loading="lazy" />
                ) : (
                  <span className="text-2xl" aria-hidden>🌐</span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{ULKELER[k][dil]}</span>
                  <span className="block text-xs" style={{ color: "var(--muted)" }}>
                    {n} {en ? "stations" : "istasyon"}
                    {SAAT_DILIMI[k] && <> · <YerelSaat tz={SAAT_DILIMI[k]!} /></>}
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
