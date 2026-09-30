import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

// Şarkı sayfası — "X şarkısı hangi radyoda çalıyor?" aramasının cevabı.
// URL: /sarki/<sanatci-slug>--<sarki-slug> (çift tire ayraç). ISR saatlik.
export const revalidate = 3600;

type Ozet = {
  sanatci: string;
  ad: string;
  kez7: number;
  kez30: number;
  istasyonlar: { name: string; slug: string; kez: number }[];
  sonlar: { name: string; slug: string; started_at: string }[];
  suan: { name: string; slug: string }[] | null;
};

function parcala(slug: string): { aslug: string; tslug: string } | null {
  const i = slug.indexOf("--");
  if (i <= 0 || i >= slug.length - 2) return null;
  return { aslug: slug.slice(0, i), tslug: slug.slice(i + 2) };
}

async function ozetAl(slug: string): Promise<{ o: Ozet; aslug: string } | null> {
  const p = parcala(slug);
  if (!p) return null;
  const { data } = await getSupabase().rpc("sarki_ozet", { p_aslug: p.aslug, p_tslug: p.tslug });
  return data ? { o: data as Ozet, aslug: p.aslug } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await ozetAl(slug);
  if (!r) return { title: "Şarkı bulunamadı | ŞİMDİ" };
  return {
    title: `${r.o.sanatci} — ${r.o.ad}: hangi radyoda çalıyor? | ŞİMDİ`,
    description: `${r.o.sanatci} — ${r.o.ad} son 7 günde Türkiye radyolarında ${r.o.kez7} kez çaldı. Hangi istasyonlarda, en son ne zaman — canlı arşivden gerçek sayım.`,
    alternates: { canonical: `/sarki/${slug}` },
  };
}

function nezaman(t: string): string {
  const dk = Math.max(0, Math.floor((Date.now() - Date.parse(t)) / 60000));
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} saat önce`;
  return `${Math.floor(sa / 24)} gün önce`;
}

export default async function Sayfa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await ozetAl(slug);
  if (!r) notFound();
  const { o, aslug } = r;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: o.ad,
    byArtist: { "@type": "MusicGroup", name: o.sanatci, url: `https://necaliyor.co/sanatci/${aslug}` },
    url: `https://necaliyor.co/sarki/${slug}`,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-8">
          <p className="mono text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            şarkı sayacı · canlı arşivden
          </p>
          <h1 className="brand mt-1 text-3xl font-bold tracking-tight">{o.ad}</h1>
          <p className="mt-1 text-lg">
            <Link href={`/sanatci/${aslug}`} className="underline underline-offset-2" style={{ color: "var(--muted)" }}>
              {o.sanatci}
            </Link>
          </p>
        </header>

        {o.suan && o.suan.length > 0 && (
          <div className="mb-6 rounded-2xl border p-5" style={{ borderColor: "var(--accent, #3ddc84)" }}>
            <p className="text-sm font-semibold">
              🔴 ŞU AN ÇALIYOR:{" "}
              {o.suan.map((s, i) => (
                <span key={s.slug}>
                  {i > 0 && " · "}
                  <Link href={`/?ist=${s.slug}`} className="underline">{s.name}</Link>
                </span>
              ))}{" "}
              — dokun, dinle.
            </p>
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: "var(--line)" }}>
            <p className="text-3xl font-bold tabular-nums">{o.kez7}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>kez · son 7 gün</p>
          </div>
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: "var(--line)" }}>
            <p className="text-3xl font-bold tabular-nums">{o.kez30}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>kez · son 30 gün</p>
          </div>
        </div>

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          hangi radyolarda çalıyor?
        </h2>
        <div className="mb-8 flex flex-wrap gap-2">
          {o.istasyonlar.map((s) => (
            <Link key={s.slug} href={`/radyo/${s.slug}`} className="press rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: "var(--line)" }}>
              {s.name} <span style={{ color: "var(--muted)" }}>· {s.kez}</span>
            </Link>
          ))}
        </div>

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          en son ne zaman çaldı?
        </h2>
        <ul className="mb-10">
          {o.sonlar.map((s, i) => (
            <li key={i} className="flex items-baseline gap-3 border-b py-2.5 text-sm" style={{ borderColor: "var(--line)" }}>
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="mono shrink-0 text-xs" style={{ color: "var(--muted)" }}>{nezaman(s.started_at)}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
          <p className="text-sm">
            🔔 <strong>{o.sanatci}</strong> yine çalınca haber almak için{" "}
            <Link href="/" className="underline">ŞİMDİ&apos;de</Link> izlemeye al, radar zilini kur.
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Haftanın tam listesi: <Link href="/liste" className="underline">ŞİMDİ LİSTESİ →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
