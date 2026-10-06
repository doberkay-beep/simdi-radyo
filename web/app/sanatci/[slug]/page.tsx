import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { sarkiSlug } from "@/lib/seoslug";
import SanatciTakipDugme from "@/components/SanatciTakipDugme";
import RozetPaylas from "@/components/RozetPaylas";

// Sanatçı sayfası — "X radyoda ne kadar çalınıyor?" aramasının cevabı.
// ISR: saatte bir tazelenir; veri plays arşivinden (sanatci_ozet RPC).
export const revalidate = 3600;

type Ozet = {
  ad: string;
  kez7: number;
  kez30: number;
  istasyonSay: number;
  sarkilar: { title: string; slug: string; kez: number }[];
  istasyonlar: { name: string; slug: string; kez: number }[];
  sonlar: { title: string; name: string; slug: string; started_at: string }[];
  suan: { name: string; slug: string; title: string | null }[] | null;
};

async function ozetAl(slug: string): Promise<Ozet | null> {
  const { data } = await getSupabase().rpc("sanatci_ozet", { p_slug: slug });
  return (data as Ozet | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = await ozetAl(slug);
  if (!o) return { title: "Sanatçı bulunamadı | ŞİMDİ" };
  return {
    title: `${o.ad} radyoda ne kadar çalınıyor? | ŞİMDİ`,
    description: `${o.ad} son 7 günde Türkiye radyolarında ${o.kez7} kez çaldı (30 günde ${o.kez30} kez, ${o.istasyonSay} istasyon). En çok çalan şarkıları ve istasyonları — canlı sayım.`,
    alternates: { canonical: `/sanatci/${slug}` },
    // Link paylaşılınca önizleme = sanatçının radyo rozeti.
    openGraph: {
      title: `${o.ad} — Türkiye radyolarında ${o.kez7 || o.kez30} kez`,
      images: [{ url: `/sanatci/${slug}/rozet?boyut=og`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [`/sanatci/${slug}/rozet?boyut=og`] },
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
  const o = await ozetAl(slug);
  if (!o) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: o.ad,
    url: `https://necaliyor.co/sanatci/${slug}`,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-8">
          <p className="mono text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            radyo sayacı · canlı arşivden
          </p>
          <h1 className="brand mt-1 text-4xl font-bold tracking-tight">{o.ad}</h1>
          <p className="epigraf mt-2 text-[15px]">Türkiye radyolarında ne kadar çalınıyor — gerçek sayım.</p>
          <SanatciTakipDugme ad={o.ad} />
        </header>

        {/* Şu an çalıyor mu? */}
        {o.suan && o.suan.length > 0 && (
          <div className="mb-6 rounded-2xl border p-5" style={{ borderColor: "var(--accent, #3ddc84)" }}>
            <p className="text-sm font-semibold">
              🔴 ŞU AN ÇALIYOR:{" "}
              {o.suan.map((s, i) => (
                <span key={s.slug}>
                  {i > 0 && " · "}
                  <Link href={`/?ist=${s.slug}`} className="underline">{s.name}</Link>
                  {s.title ? ` (${s.title})` : ""}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Sayılar */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { n: o.kez7, e: "son 7 günde" },
            { n: o.kez30, e: "son 30 günde" },
            { n: o.istasyonSay, e: "istasyonda" },
          ].map((k) => (
            <div key={k.e} className="rounded-2xl border p-4 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="text-3xl font-bold tabular-nums">{k.n}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{k.e === "istasyonda" ? k.e : `kez ${k.e}`}</p>
            </div>
          ))}
        </div>

        {/* 📣 Radyo rozeti — sanatçı/menajer/hayran paylaşsın */}
        {(o.kez7 > 0 || o.kez30 > 0) && (
          <RozetPaylas
            taban={`/sanatci/${slug}/rozet`}
            dosyaAdi={`simdi-${slug}`}
            etiket="📣 radyo rozeti"
            baslik="Sanatçısı, menajeri ya da hayranı mısın? Bunu paylaş."
            aciklama={`Anket değil, gerçek sayım: ${o.ad} ${o.kez7 > 0 ? "son 7 günde" : "son 30 günde"} Türkiye radyolarında ${o.kez7 > 0 ? o.kez7 : o.kez30} kez çaldı. Rozet her saat tazelenir.`}
            metin={`${o.ad} ${o.kez7 > 0 ? "son 7 günde" : "son 30 günde"} Türkiye radyolarında ${o.kez7 > 0 ? o.kez7 : o.kez30} kez çaldı 📻 Gerçek sayım: https://necaliyor.co/sanatci/${slug}`}
          />
        )}

        {/* En çok çalınan şarkıları */}
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          en çok çalınan şarkıları (30 gün)
        </h2>
        <ol className="mb-8">
          {o.sarkilar.map((s, i) => (
            <li key={s.slug} className="flex items-baseline gap-3 border-b py-2.5" style={{ borderColor: "var(--line)" }}>
              <span className="mono w-6 text-right text-sm tabular-nums" style={{ color: "var(--muted)" }}>{i + 1}</span>
              <Link href={`/sarki/${slug}--${s.slug}`} className="min-w-0 flex-1 truncate font-semibold underline-offset-2 hover:underline">
                {s.title}
              </Link>
              <span className="mono text-xs tabular-nums" style={{ color: "var(--muted)" }}>{s.kez} kez</span>
            </li>
          ))}
        </ol>

        {/* En çok çaldıran istasyonlar */}
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          en çok çaldıran istasyonlar
        </h2>
        <div className="mb-8 flex flex-wrap gap-2">
          {o.istasyonlar.map((s) => (
            <Link prefetch={false} key={s.slug} href={`/radyo/${s.slug}`} className="press rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: "var(--line)" }}>
              {s.name} <span style={{ color: "var(--muted)" }}>· {s.kez}</span>
            </Link>
          ))}
        </div>

        {/* Son çalınmalar */}
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          son çalınmalar
        </h2>
        <ul className="mb-10">
          {o.sonlar.map((s, i) => (
            <li key={i} className="flex items-baseline gap-3 border-b py-2.5 text-sm" style={{ borderColor: "var(--line)" }}>
              <span className="min-w-0 flex-1 truncate">
                <strong>{s.title}</strong>
                <span style={{ color: "var(--muted)" }}> — {s.name}</span>
              </span>
              <span className="mono shrink-0 text-xs" style={{ color: "var(--muted)" }}>{nezaman(s.started_at)}</span>
            </li>
          ))}
        </ul>

        {/* CTA'lar */}
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
          <p className="text-sm">
            🔔 <strong>{o.ad}</strong> bir radyoda çalmaya başladığı an haber almak ister misin?
          </p>
          <SanatciTakipDugme ad={o.ad} />
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            Haftanın tam listesi: <Link href="/liste" className="underline">ŞİMDİ LİSTESİ →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
