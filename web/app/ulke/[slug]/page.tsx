import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { ULKELER, ULKE_SLUG, ulkeSlug, bayrakUrl, ulkeIstasyonSluglari, doluUlkeler, type UlkeKodu } from "@/lib/ulkeler";

// Ülke merkez sayfası — "Almanya radyoları canlı" gibi aramalar + atlas gezgini.
export const revalidate = 600;

const DEFAULT_ACCENT = "#6b7280";

function readableOn(hex: string): string {
  const h = (hex || DEFAULT_ACCENT).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#050505" : "#ffffff";
}

export function generateStaticParams() {
  return Object.keys(ULKE_SLUG).map((slug) => ({ slug }));
}

/* Ablatif eki — büyük ünlü uyumu (son ünlüye göre -dan/-den). */
function dan(ad: string): string {
  if (ad === "ABD") return "ABD'den";
  const unluler = [...ad.toLowerCase()].filter((c) => "aeıioöuü".includes(c));
  const son = unluler[unluler.length - 1] ?? "e";
  return `${ad}'${"aıou".includes(son) ? "dan" : "den"}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const kod = ULKE_SLUG[slug];
  if (!kod) return { title: "Ülke bulunamadı — ŞİMDİ" };
  const u = ULKELER[kod];
  const baslik = kod === "www" ? "İnternet Radyoları" : `${u.tr} Radyoları`;
  return {
    title: `${baslik} — canlı dinle, şu an ne çalıyor | ŞİMDİ`,
    description: `${baslik}: seçme istasyonlar, tek tıkla canlı yayın ve şu an çalan parçalar. ${u.en} radio stations, live.`,
    alternates: { canonical: `/ulke/${slug}` },
    openGraph: { title: `${baslik} — canlı`, description: `${u.en} radio, live — now playing.`, type: "website" },
  };
}

type St = { slug: string; name: string; city: string | null; frequency: string | null; accent_color: string | null; genre: string | null };

async function getStations(kod: UlkeKodu): Promise<St[]> {
  const sluglar = ulkeIstasyonSluglari(kod);
  if (sluglar.length === 0) return [];
  try {
    const supa = getSupabase();
    const { data } = await supa
      .from("stations")
      .select("slug, name, city, frequency, accent_color, genre")
      .in("slug", sluglar)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as St[];
  } catch {
    return [];
  }
}

export default async function UlkePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kod = ULKE_SLUG[slug];
  if (!kod) notFound();
  const u = ULKELER[kod];
  const stations = await getStations(kod);
  const bayrak = bayrakUrl(kod);
  const baslik = kod === "www" ? "İnternet Radyoları" : `${u.tr} Radyoları`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${baslik} — ŞİMDİ`,
    url: `https://necaliyor.co/ulke/${slug}`,
    description: `${baslik} — canlı yayın ve şu an çalan parçalar.`,
    hasPart: stations.slice(0, 30).map((s) => ({
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
          <Link href="/ulke" className="text-sm underline" style={{ color: "var(--muted)" }}>
            ← atlas
          </Link>
          <Link href="/" className="brand text-sm font-bold tracking-tight">ŞİMDİ</Link>
        </header>

        <div className="flex items-center gap-3">
          {bayrak ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bayrak} alt="" width={40} height={30} className="rounded-[4px] border" style={{ borderColor: "var(--line)" }} />
          ) : (
            <span className="text-3xl" aria-hidden>🌐</span>
          )}
          <h1 className="brand text-4xl font-bold tracking-tight">{baslik}</h1>
        </div>
        <p className="epigraf mt-3 text-[15px]">
          {kod === "www"
            ? "Yalnızca internette yaşayan istasyonlar — frekansları yok, sınırları da."
            : `${dan(u.tr)} seçme istasyonlar — dokun, o ülkenin şu an'ına bağlan.`}
        </p>

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
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{s.name}</span>
                    <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>
                      {[s.genre, s.city || s.frequency].filter(Boolean).join(" · ") || "canlı"}
                    </span>
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>dinle →</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Diğer ülkeler — atlas ağı */}
        <nav className="mt-10">
          <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            diğer ülkeler
          </h2>
          <div className="flex flex-wrap gap-2">
            {doluUlkeler().filter((k) => k !== kod).map((k) => {
              const b = bayrakUrl(k);
              return (
                <Link
                  key={k}
                  href={`/ulke/${ulkeSlug(k)}`}
                  className="press flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                  style={{ borderColor: "var(--line)", color: "var(--fg)" }}
                >
                  {b ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b} alt="" width={18} height={13} className="rounded-[2px]" loading="lazy" />
                  ) : (
                    <span aria-hidden>🌐</span>
                  )}
                  {ULKELER[k].tr}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
