import type { Metadata } from "next";
import Link from "next/link";
import { senkronDefteri, senkronRekoru, yayilma, trZaman } from "@/lib/senkron";

// ⚡ SENKRON DEFTERİ — aynı şarkının birbirinden habersiz radyolarda aynı
// anda başladığı nadir anların kaydı.
export const revalidate = 120;

export const metadata: Metadata = {
  title: "Senkron Defteri — aynı şarkı, aynı anda, birbirinden habersiz radyolarda | ŞİMDİ",
  description:
    "Türkiye'nin radyoları birbirinden habersiz yayın yapar. Bazen aynı şarkı dakikalar içinde 3 radyoda birden başlar — nadir bir an. ŞİMDİ hepsini yakalayıp buraya yazıyor.",
  alternates: { canonical: "/senkron" },
};

export default async function Sayfa() {
  const [defter, rekor] = await Promise.all([senkronDefteri(40), senkronRekoru()]);
  const haftada = defter.filter((a) => Date.parse(a.son) > Date.now() - 7 * 864e5).length;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
        <Link href="/" className="nav-link">ŞİMDİ</Link> · nadir anlar kaydı
      </p>
      <h1 className="brand mt-2 text-4xl font-bold leading-tight">⚡ SENKRON DEFTERİ</h1>
      <p className="epigraf mt-3 text-base">
        Radyolar birbirini duymaz. Her biri kendi listesini, kendi saatini çalar. Ama bazen aynı
        şarkı, birkaç dakika arayla, üç radyoda birden başlar. Kimse anlaşmamıştır. Buna senkron
        diyoruz; burada hepsi kayıtlı.
      </p>
      <p className="mono mt-3 text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
        kural: aynı şarkı · 4 dakika içinde · en az 3 türk radyosu · son 7 günde {haftada} kez
      </p>

      {rekor && (
        <Link
          href={`/senkron/${rekor.id}`}
          className="senkron-bant press mt-8 block rounded-2xl border p-5"
        >
          <span className="mono block text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--glow-hi)" }}>
            🏆 rekor · {rekor.sayi} radyo aynı anda
          </span>
          <span className="mt-1 block text-lg font-bold">{rekor.artist} — {rekor.title}</span>
          <span className="mt-0.5 block text-sm" style={{ color: "var(--muted)" }}>
            {trZaman(rekor.ilk)} · {yayilma(rekor)} · {rekor.istasyonlar.map((s) => s.name).join(", ")}
          </span>
        </Link>
      )}

      <ol className="mt-8 grid gap-2">
        {defter.map((a) => (
          <li key={a.id}>
            <Link href={`/senkron/${a.id}`} className="press flex items-baseline gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--line-hi)" }}>
              <span className="mono w-10 shrink-0 text-sm font-bold" style={{ color: "var(--glow-hi)" }}>×{a.sayi}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{a.artist} — {a.title}</span>
                <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>
                  {trZaman(a.ilk)} · {a.istasyonlar.map((s) => s.name).join(" · ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
        {defter.length === 0 && (
          <p className="epigraf text-base">Defter henüz boş — ilk senkron anı bekleniyor. Nadir olmasının güzelliği bu.</p>
        )}
      </ol>
    </main>
  );
}
