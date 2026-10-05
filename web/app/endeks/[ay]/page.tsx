import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { sarkiSlug } from "@/lib/seoslug";
import { endeksAylari, ayAdi, type EndeksOzet } from "@/lib/endeks";

// Ayın endeks sayfası — basın raporunun kalıcı, linklenebilir hali.
export const revalidate = 3600;

async function ozet(ay: string): Promise<EndeksOzet | null> {
  if (!/^\d{4}-\d{2}$/.test(ay)) return null;
  try {
    const { data } = await getSupabase().rpc("endeks_ozet", { p_ay: ay });
    return (data as EndeksOzet | null) ?? null;
  } catch { return null; }
}

export function generateStaticParams() {
  return endeksAylari().map((ay) => ({ ay }));
}

export async function generateMetadata({ params }: { params: Promise<{ ay: string }> }): Promise<Metadata> {
  const { ay } = await params;
  const o = await ozet(ay);
  if (!o) return { title: "Endeks bulunamadı | ŞİMDİ" };
  const zirve = o.liste[0];
  return {
    title: `Türkiye Radyo Endeksi — ${ayAdi(ay)} | ŞİMDİ`,
    description: `${ayAdi(ay)}: ${o.toplam.toLocaleString("tr-TR")} kayıtlı çalma. Ayın şarkısı: ${zirve ? `${zirve.artist} — ${zirve.title}` : "—"}. Ayın sanatçısı: ${o.sanatci?.ad ?? "—"}. Radyolarda gerçekte en çok çalanların resmi sayımı.`,
    alternates: { canonical: `/endeks/${ay}` },
  };
}

export default async function Sayfa({ params }: { params: Promise<{ ay: string }> }) {
  const { ay } = await params;
  const o = await ozet(ay);
  if (!o) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
        <Link href="/endeks" className="nav-link">TÜRKİYE RADYO ENDEKSİ</Link>
      </p>
      <h1 className="brand mt-2 text-4xl font-bold leading-tight">{ayAdi(ay).toLocaleUpperCase("tr")}</h1>
      {o.devam && (
        <p className="epigraf mt-2 text-sm">sayım sürüyor — ay kapanınca bu sayfa resmileşir.</p>
      )}
      {ay < "2026-10" && (
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          📏 Bu ayın sayımı aralıklı örneklemedir (kesintisiz sayım 1 Ekim 2026&apos;da başladı): toplam,
          sonraki aylarla karşılaştırılamaz; sıralama karşılaştırılabilir.
        </p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line-hi)" }}>
          <div className="mono text-2xl font-bold" style={{ color: "var(--glow-hi)" }}>
            {o.toplam.toLocaleString("tr-TR")}
          </div>
          <div className="mono mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
            kayıtlı çalma
          </div>
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line-hi)" }}>
          <div className="truncate text-lg font-bold" style={{ color: "var(--glow-hi)" }}>
            {o.sanatci?.ad ?? "—"}
          </div>
          <div className="mono mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
            ayın sanatçısı
          </div>
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line-hi)" }}>
          <div className="truncate text-lg font-bold" style={{ color: "var(--glow-hi)" }}>
            {o.liste[0]?.title ?? "—"}
          </div>
          <div className="mono mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
            ayın şarkısı
          </div>
        </div>
      </div>

      <ol className="mt-8 grid gap-1.5">
        {o.liste.map((s, i) => (
          <li
            key={`${s.artist}-${s.title}`}
            className="flex items-baseline gap-3 rounded-xl border px-4 py-3"
            style={{
              borderColor: i < 3 ? "color-mix(in srgb, var(--glow) 55%, var(--line-hi))" : "var(--line-hi)",
              background: i < 3 ? "color-mix(in srgb, var(--glow) 7%, var(--panel))" : "transparent",
            }}
          >
            <span className="mono w-7 shrink-0 text-right text-sm font-bold" style={{ color: i < 3 ? "var(--glow-hi)" : "var(--muted)" }}>
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <Link href={`/sarki/${sarkiSlug(s.artist)}--${sarkiSlug(s.title)}`} className="block truncate font-semibold hover:underline">
                {s.title}
              </Link>
              <Link href={`/sanatci/${sarkiSlug(s.artist)}`} className="block truncate text-sm hover:underline" style={{ color: "var(--muted)" }}>
                {s.artist}
              </Link>
            </span>
            <span className="mono shrink-0 text-xs" style={{ color: "var(--muted)" }}>
              {s.kez} kez · {s.istasyon} ist
            </span>
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--line-hi)", color: "var(--muted)" }}>
        📂 Bu ayın ham verisi:{" "}
        <a href={`/endeks/${ay}/veri`} className="nav-link mono">/endeks/{ay}/veri</a> (JSON, açık veri).
        Alıntı: <em>&quot;necaliyor.co Türkiye Radyo Endeksi&quot;</em>
      </section>
    </main>
  );
}
