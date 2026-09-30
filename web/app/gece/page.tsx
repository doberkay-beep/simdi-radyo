import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { sarkiSlug } from "@/lib/seoslug";

// 🌙 GECE 3 LİSTESİ — Uykusuzların Listesi: son 7 gecenin 02:00–04:59'u.
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Gece 3 Listesi — uykusuzların listesi | ŞİMDİ",
  description:
    "Türkiye radyolarında gece 02:00 ile 05:00 arası en çok çalan şarkılar — son 7 gecenin gerçek sayımı. Şehir uyurken radyo ne çalıyor?",
  alternates: { canonical: "/gece" },
};

type Satir = { artist: string; title: string; kez: number; istasyon: number };

export default async function Sayfa() {
  let liste: Satir[] = [];
  try {
    const { data } = await getSupabase().rpc("gece_listesi", { adet: 20 });
    liste = (data as Satir[] | null) ?? [];
  } catch { /* boş liste */ }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
        <Link href="/" className="nav-link">ŞİMDİ</Link> · 02:00 – 05:00 · son 7 gece
      </p>
      <h1 className="brand mt-2 text-4xl font-bold leading-tight">🌙 GECE 3 LİSTESİ</h1>
      <p className="epigraf mt-3 text-base">
        Şehir uyurken radyolar susmaz. Bu liste, gece üçte uyanık olanların ortak şarkılarıdır:
        taksiciler, nöbetçiler, uykusuzlar ve radyoyu açık unutanlar.
      </p>

      <ol className="mt-8 grid gap-1.5">
        {liste.map((s, i) => (
          <li
            key={`${s.artist}-${s.title}`}
            className="flex items-baseline gap-3 rounded-xl border px-4 py-3"
            style={{
              borderColor: i < 3 ? "color-mix(in srgb, var(--glow) 55%, var(--line-hi))" : "var(--line-hi)",
              background: i < 3 ? "color-mix(in srgb, var(--glow) 7%, var(--panel))" : "transparent",
            }}
          >
            <span className="mono w-7 shrink-0 text-right text-sm font-bold" style={{ color: i < 3 ? "var(--glow-hi)" : "var(--muted)" }}>{i + 1}</span>
            <span className="min-w-0 flex-1">
              <Link href={`/sarki/${sarkiSlug(s.artist)}--${sarkiSlug(s.title)}`} className="block truncate font-semibold hover:underline">{s.title}</Link>
              <Link href={`/sanatci/${sarkiSlug(s.artist)}`} className="block truncate text-sm hover:underline" style={{ color: "var(--muted)" }}>{s.artist}</Link>
            </span>
            <span className="mono shrink-0 text-xs" style={{ color: "var(--muted)" }}>{s.kez} gece çalma · {s.istasyon} ist</span>
          </li>
        ))}
        {liste.length === 0 && <p className="epigraf text-base">Gece listesi şu an okunamadı — birazdan yine dene.</p>}
      </ol>

      <p className="mono mt-8 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
        <Link href="/liste" className="nav-link">gündüz listesi →</Link>{" "}
        <Link href="/senkron" className="nav-link">senkron defteri →</Link>
      </p>
    </main>
  );
}
