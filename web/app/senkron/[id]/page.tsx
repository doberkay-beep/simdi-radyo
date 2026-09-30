import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { senkronAl, yayilma, trZaman } from "@/lib/senkron";
import { sarkiSlug } from "@/lib/seoslug";
import RozetPaylas from "@/components/RozetPaylas";

// Tek bir Senkron Anı — paylaşılan link bu sayfaya gelir; önizlemesi kartın kendisi.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const an = await senkronAl(Number(id));
  if (!an) return { title: "Senkron anı bulunamadı | ŞİMDİ" };
  const baslik = `⚡ ${an.sayi} radyo aynı anda: ${an.artist} — ${an.title}`;
  return {
    title: `${baslik} | ŞİMDİ`,
    description: `${trZaman(an.ilk)} — ${an.istasyonlar.map((s) => s.name).join(", ")} birbirinden habersiz, ${yayilma(an)} aynı şarkıyı çalmaya başladı.`,
    alternates: { canonical: `/senkron/${an.id}` },
    openGraph: { title: baslik, images: [{ url: `/senkron/${an.id}/kart?boyut=og`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [`/senkron/${an.id}/kart?boyut=og`] },
  };
}

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const an = await senkronAl(Number(id));
  if (!an) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
        <Link href="/senkron" className="nav-link">⚡ SENKRON DEFTERİ</Link> · #{an.id}
      </p>
      <h1 className="brand mt-2 text-4xl font-bold leading-tight">
        {an.sayi} radyo, aynı anda
      </h1>
      <p className="mt-3 text-xl font-semibold">
        <Link href={`/sarki/${sarkiSlug(an.artist)}--${sarkiSlug(an.title)}`} className="hover:underline">
          {an.artist} — {an.title}
        </Link>
      </p>
      <p className="epigraf mt-2 text-base">
        {trZaman(an.ilk)}. Birbirinden habersiz {an.sayi} radyo, {yayilma(an)} aynı şarkıyı çalmaya başladı.
      </p>

      <ol className="mt-6 grid gap-2">
        {an.istasyonlar.map((s, i) => (
          <li key={s.slug}>
            <Link href={`/radyo/${s.slug}`} className="press flex items-baseline gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--line-hi)" }}>
              <span className="mono w-6 shrink-0 text-sm font-bold" style={{ color: "var(--glow-hi)" }}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{s.name}</span>
              <span className="mono shrink-0 text-xs" style={{ color: "var(--muted)" }}>
                {new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(s.t))}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <RozetPaylas
          taban={`/senkron/${an.id}/kart`}
          dosyaAdi={`simdi-senkron-${an.id}`}
          etiket="⚡ senkron kartı"
          baslik="Bu nadir anı paylaş."
          aciklama={`${an.artist} — ${an.title}: ${an.sayi} radyo, ${yayilma(an)}. Radyolar anlaşmadı; şarkı kendi buldu.`}
          metin={`⚡ Senkron anı: ${an.sayi} radyo birbirinden habersiz aynı anda "${an.title}" (${an.artist}) çalmaya başladı. https://necaliyor.co/senkron/${an.id}`}
        />
      </div>
    </main>
  );
}
