import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DENEMELER, denemeBul } from "@/lib/denemeler";
import Muhur from "@/components/Muhur";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamicParams = false;

export function generateStaticParams() {
  return DENEMELER.map((d) => ({ slug: d.slug }));
}

function tarihTR(s: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s));
  } catch {
    return s;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = denemeBul(slug);
  if (!d) return { title: "Deneme bulunamadı — ŞİMDİ" };
  return {
    title: `${d.baslik} — Köşe | ŞİMDİ`,
    description: d.ozet,
    alternates: { canonical: `/kose/${slug}` },
    openGraph: { title: d.baslik, description: d.ozet, type: "article" },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = denemeBul(slug);
  if (!d) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: d.baslik,
    datePublished: d.tarih,
    author: { "@type": "Person", name: "Berkay Doğan" },
    url: `https://necaliyor.co/kose/${slug}`,
  };

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: "#9c5f7c" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/kose" className="text-sm underline" style={{ color: "var(--muted)" }}>
            ← köşe
          </Link>
          <ThemeToggle />
        </header>

        <article>
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            {tarihTR(d.tarih)}
          </p>
          <h1 className="brand mt-2 text-4xl font-bold tracking-tight">{d.baslik}</h1>
          {d.epigraf && (
            <p className="epigraf mt-4 text-lg italic">{d.epigraf}</p>
          )}

          <div className="read mt-8 text-[17px] leading-relaxed" style={{ color: "var(--fg)" }}>
            {d.govde.map((p, i) => (
              <p key={i} className={i === 0 ? "dropcap" : "mt-5"}>
                {p}
              </p>
            ))}
          </div>
        </article>

        <Muhur dize={d.epigraf} />
      </div>
    </div>
  );
}
