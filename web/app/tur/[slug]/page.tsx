import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { TURLER, turBul } from "@/lib/turler";

// Tür merkez sayfası — "caz radyosu" gibi yüksek hacimli aramalar için.
export const revalidate = 600;

const DEFAULT_ACCENT = "#6b7280";

function readableOn(hex: string): string {
  const h = (hex || DEFAULT_ACCENT).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

export function generateStaticParams() {
  return TURLER.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = turBul(slug);
  if (!t) return { title: "Tür bulunamadı — ŞİMDİ" };
  return {
    title: `${t.baslik} — canlı dinle, şu an ne çalıyor | ŞİMDİ`,
    description: t.ozet,
    alternates: { canonical: `/tur/${slug}` },
    openGraph: { title: `${t.baslik} — canlı`, description: t.ozet, type: "website" },
  };
}

type St = { slug: string; name: string; city: string | null; frequency: string | null; accent_color: string | null; band: string | null };

async function getStations(genre: string): Promise<St[]> {
  try {
    const supa = getSupabase();
    const { data } = await supa
      .from("stations")
      .select("slug, name, city, frequency, accent_color, band")
      .eq("genre", genre)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as St[];
  } catch {
    return [];
  }
}

export default async function TurPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = turBul(slug);
  if (!t) notFound();
  const stations = await getStations(t.genre);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${t.baslik} — ŞİMDİ`,
    url: `https://necaliyor.co/tur/${slug}`,
    description: t.ozet,
    hasPart: stations.slice(0, 25).map((s) => ({
      "@type": "RadioStation",
      name: s.name,
      url: `https://necaliyor.co/radyo/${s.slug}`,
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
          <span className="brand text-sm font-bold tracking-tight">ŞİMDİ</span>
        </header>

        <h1 className="brand text-4xl font-bold tracking-tight">{t.baslik}</h1>
        <p className="epigraf mt-2 text-[15px]">{t.ozet}</p>

        <div className="read mt-6 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
          <p>{t.govde}</p>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            {stations.length} istasyon
          </h2>
          <div className="flex flex-col">
            {stations.map((s) => {
              const c = s.accent_color || DEFAULT_ACCENT;
              return (
                <Link
                  key={s.slug}
                  href={`/radyo/${s.slug}`}
                  className="press flex items-center gap-3 border-b py-3"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 50%, #000))`, color: readableOn(c) }}
                  >
                    {s.name.trim().charAt(0).toLocaleUpperCase("tr")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{s.name}</span>
                    <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>
                      {[s.band === "int" ? s.city : s.frequency].filter(Boolean).join(" · ") || "canlı"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Diğer türler — iç bağlantı ağı */}
        <nav className="mt-10">
          <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            diğer türler
          </h2>
          <div className="flex flex-wrap gap-2">
            {TURLER.filter((x) => x.slug !== slug).map((x) => (
              <Link
                key={x.slug}
                href={`/tur/${x.slug}`}
                className="press rounded-full border px-3 py-1 text-sm"
                style={{ borderColor: "var(--line)", color: "var(--fg)" }}
              >
                {x.baslik.replace(" Radyoları", "").replace(" Radyoları", "")}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
