import type { Metadata } from "next";
import Link from "next/link";
import { ULKELER, ulkeSlug, bayrakUrl, doluUlkeler, ulkeIstasyonSluglari, SAAT_DILIMI } from "@/lib/ulkeler";
import YerelSaat from "@/components/YerelSaat";

// Dünya Atlası — ülke ülke radyo gezgini.
export const metadata: Metadata = {
  title: "Dünya Atlası — ülke ülke canlı radyo | ŞİMDİ",
  description: "Türkiye'den Japonya'ya, Brezilya'dan İsveç'e: ülke ülke seçme radyolar, tek tıkla canlı yayın ve şu an çalan parçalar. World radio by country, live.",
  alternates: { canonical: "/ulke" },
  openGraph: { title: "Dünya Atlası — ŞİMDİ", description: "Ülke ülke canlı radyo. World radio by country.", type: "website" },
};

export default function AtlasPage() {
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
            ← şimdi
          </Link>
          <Link href="/" className="brand text-sm font-bold tracking-tight">ŞİMDİ</Link>
        </header>

        <h1 className="brand text-4xl font-bold tracking-tight">Dünya Atlası</h1>
        <p className="epigraf mt-3 text-[15px]">
          Her ülkenin bir &ldquo;şimdi&rdquo;si var. Bir bayrağa dokun; o ülkenin frekanslarına bağlan.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ulkeler.map((k) => {
            const b = bayrakUrl(k);
            const n = ulkeIstasyonSluglari(k).length;
            return (
              <Link
                key={k}
                href={`/ulke/${ulkeSlug(k)}`}
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
                  <span className="block truncate text-[15px] font-semibold">{ULKELER[k].tr}</span>
                  <span className="block text-xs" style={{ color: "var(--muted)" }}>
                    {n} istasyon
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
