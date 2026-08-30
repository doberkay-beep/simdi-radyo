import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { parcaSlug } from "@/lib/parca";

// Parça sayfası — "X şarkısı hangi radyoda çaldı" uzun-kuyruk SEO motoru.
// İnce içerik riskine karşı: yalnızca ≥2 kez çalınmış parçalar sayfa alır.
export const revalidate = 300;

const DEFAULT_ACCENT = "#6b7280";
const pad = (n: number) => String(n).padStart(2, "0");

function readableOn(hex: string): string {
  const h = (hex || DEFAULT_ACCENT).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

type Play = { station_id: number; artist: string | null; title: string | null; raw_title: string | null; started_at: string };
type Ist = { slug: string; name: string; accentColor: string | null };

async function getParca(slug: string) {
  try {
    const supa = getSupabase();
    const like = `%${slug.replace(/-/g, "%")}%`;
    const { data } = await supa
      .from("plays")
      .select("station_id, artist, title, raw_title, started_at")
      .ilike("title", like)
      .order("started_at", { ascending: false })
      .limit(300);
    const plays = ((data ?? []) as Play[]).filter((p) => parcaSlug(p.title || p.raw_title || "") === slug);
    if (plays.length < 2) return null;

    // İstasyon adlarını çek.
    const ids = [...new Set(plays.map((p) => p.station_id))];
    const istMap = new Map<number, Ist>();
    const { data: sts } = await supa.from("stations").select("id, slug, name, accent_color").in("id", ids);
    for (const s of sts ?? []) istMap.set(s.id, { slug: s.slug, name: s.name, accentColor: s.accent_color });

    // Temsili başlık/sanatçı + istasyon dağılımı.
    const baslik = plays[0].title || plays[0].raw_title || slug;
    const artist = plays.find((p) => p.artist && p.artist !== p.title)?.artist ?? null;
    const istSay = new Map<number, number>();
    for (const p of plays) istSay.set(p.station_id, (istSay.get(p.station_id) || 0) + 1);
    const istasyonlar = [...istSay.entries()]
      .map(([id, adet]) => ({ ...(istMap.get(id) || { slug: "", name: "—", accentColor: null }), adet }))
      .filter((x) => x.slug)
      .sort((a, b) => b.adet - a.adet);

    return {
      baslik,
      artist,
      toplam: plays.length,
      ilk: plays[plays.length - 1].started_at,
      son: plays[0].started_at,
      istasyonlar,
      sonCalmalar: plays.slice(0, 12),
      istMap,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getParca(slug);
  if (!p) return { title: "Parça bulunamadı — ŞİMDİ" };
  const ad = p.artist && p.artist !== p.baslik ? `${p.artist} — ${p.baslik}` : p.baslik;
  const desc = `"${ad}" necaliyor arşivinde ${p.toplam} kez, ${p.istasyonlar.length} istasyonda çaldı. Hangi radyolarda çaldığını gör.`;
  return {
    title: `${ad} — hangi radyoda çaldı? | ŞİMDİ`,
    description: desc,
    alternates: { canonical: `/parca/${slug}` },
    openGraph: { title: `${ad} — hangi radyoda çaldı?`, description: desc, type: "music.song" },
  };
}

export default async function ParcaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getParca(slug);
  if (!p) notFound();
  const ad = p.artist && p.artist !== p.baslik ? `${p.artist} — ${p.baslik}` : p.baslik;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: p.baslik,
    ...(p.artist ? { byArtist: { "@type": "MusicGroup", name: p.artist } } : {}),
    url: `https://necaliyor.co/parca/${slug}`,
  };

  const tarih = (iso: string) => {
    const d = new Date(iso);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="spread min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/arsiv" className="text-sm underline" style={{ color: "var(--muted)" }}>
            ← arşiv
          </Link>
          <span className="brand text-sm font-bold tracking-tight">ŞİMDİ</span>
        </header>

        <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          parça
        </p>
        <h1 className="brand mt-1 text-3xl font-bold tracking-tight">{ad}</h1>
        <p className="epigraf mt-3 text-[15px]">
          necaliyor arşivinde <strong style={{ color: "var(--fg)" }}>{p.toplam}</strong> kez,{" "}
          <strong style={{ color: "var(--fg)" }}>{p.istasyonlar.length}</strong> istasyonda çaldı.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            çaldığı istasyonlar
          </h2>
          <div className="flex flex-col">
            {p.istasyonlar.map((s) => {
              const c = s.accentColor || DEFAULT_ACCENT;
              return (
                <Link key={s.slug} href={`/radyo/${s.slug}`} className="press flex items-center gap-3 border-b py-3" style={{ borderColor: "var(--line)" }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold" style={{ background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 50%, #000))`, color: readableOn(c) }}>
                    {s.name.trim().charAt(0).toLocaleUpperCase("tr")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{s.name}</span>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: "var(--muted)" }}>{s.adet} kez</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            son çalınmalar
          </h2>
          <ul className="flex flex-col gap-1.5">
            {p.sonCalmalar.map((c, i) => {
              const st = p.istMap.get(c.station_id);
              return (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--fg)" }}>{st?.name ?? "—"}</span>
                  <span className="tabular-nums" style={{ color: "var(--muted)" }}>{tarih(c.started_at)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="read mt-10 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
          <p>
            Bir parçanın nerede, ne zaman çaldığı da bir hikâyedir. necaliyor.co her &quot;şimdi&quot;yi kalıcı
            arşive yazar; böylece bir şarkının frekanslardaki yolculuğunu geriye dönüp görebilirsin.
          </p>
        </div>
      </div>
    </div>
  );
}
