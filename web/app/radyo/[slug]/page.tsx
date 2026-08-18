import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

// Her istasyona kendi SEO sayfası ("X Radyo canlı dinle") + doğrudan çal linki.
export const revalidate = 60;

const DEFAULT_ACCENT = "#6b7280";

type Station = {
  slug: string;
  name: string;
  city: string | null;
  frequency: string | null;
  accent_color: string | null;
  genre: string | null;
  homepage: string | null;
};

async function getStation(slug: string): Promise<Station | null> {
  try {
    const supa = getSupabase();
    const { data } = await supa
      .from("stations")
      .select("slug, name, city, frequency, accent_color, genre, homepage")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return (data as Station) ?? null;
  } catch {
    return null;
  }
}

async function getNowPlaying(slug: string) {
  try {
    const supa = getSupabase();
    const { data: st } = await supa.from("stations").select("id").eq("slug", slug).maybeSingle();
    if (!st) return null;
    const { data } = await supa
      .from("now_playing")
      .select("artist, title, raw_title")
      .eq("station_id", (st as { id: number }).id)
      .maybeSingle();
    return (data as { artist: string | null; title: string | null; raw_title: string | null }) ?? null;
  } catch {
    return null;
  }
}

function trackText(np: { artist: string | null; title: string | null; raw_title: string | null } | null): string | null {
  if (!np) return null;
  const a = np.artist?.trim() || null;
  const t = np.title?.trim() || null;
  if (a && t && a !== t) return `${a} — ${t}`;
  return t || np.raw_title || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = await getStation(slug);
  if (!s) return { title: "İstasyon bulunamadı — ŞİMDİ" };
  const np = await getNowPlaying(slug);
  const track = trackText(np);
  const bits = [s.frequency, s.city].filter(Boolean).join(" · ");
  const desc = track
    ? `${s.name}${bits ? ` (${bits})` : ""} şu an: ${track}. Canlı dinle.`
    : `${s.name}${bits ? ` (${bits})` : ""} canlı dinle — şu an ne çaldığını gör.`;
  return {
    title: `${s.name} — canlı dinle | ŞİMDİ`,
    description: desc,
    alternates: { canonical: `/radyo/${slug}` },
    openGraph: { title: `${s.name} — canlı dinle`, description: desc, type: "music.radio_station" },
  };
}

export default async function StationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getStation(slug);
  if (!s) notFound();
  const np = await getNowPlaying(slug);
  const track = trackText(np);
  const accent = s.accent_color || DEFAULT_ACCENT;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RadioStation",
    name: s.name,
    url: `https://necaliyor.co/radyo/${slug}`,
    ...(s.genre ? { genre: s.genre } : {}),
    ...(s.city ? { areaServed: s.city } : {}),
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
            ← tüm radyolar
          </Link>
          <span className="brand text-sm font-bold tracking-tight">ŞİMDİ</span>
        </header>

        <div className="flex items-center gap-4">
          <span className="h-14 w-[6px] shrink-0 rounded-full" style={{ background: accent }} />
          <div>
            <h1 className="text-4xl font-black tracking-tight">{s.name}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {[s.genre, s.frequency, s.city].filter(Boolean).join(" · ") || "canlı radyo"}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border p-5" style={{ borderColor: "var(--line)" }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            şu an çalıyor
          </div>
          <div className="mt-1 text-2xl font-semibold">{track ?? "canlı yayın"}</div>
        </div>

        <Link
          href={`/?ist=${slug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold"
          style={{ background: accent, color: "#0a0a0b" }}
        >
          ▶ Canlı Dinle
        </Link>

        <div className="mt-10 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          <p>
            <strong style={{ color: "var(--fg)" }}>{s.name}</strong> yayınını{" "}
            <Link href={`/?ist=${slug}`} className="underline" style={{ color: "var(--fg)" }}>
              necaliyor.co
            </Link>{" "}
            üzerinden canlı dinleyebilir, o an çalan parçayı görebilirsin.
            {s.homepage ? (
              <>
                {" "}
                Resmî site:{" "}
                <a href={s.homepage} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--fg)" }}>
                  {s.homepage.replace(/^https?:\/\//, "")}
                </a>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
