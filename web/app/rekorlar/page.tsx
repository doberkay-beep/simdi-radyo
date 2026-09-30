import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { sarkiSlug } from "@/lib/seoslug";

// REKORLAR — arşivin şov vitrini: paylaşılası uç değerler.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Radyo Rekorları — Türkiye radyolarının uç değerleri | ŞİMDİ",
  description:
    "Bir günde en çok çalınan şarkı, gecenin kralı, sabahın şampiyonu, bir istasyonun tek şarkıya aşkı… Türkiye radyo arşivinin rekor defteri — canlı sayımdan.",
  alternates: { canonical: "/rekorlar" },
};

type SarkiRekor = { artist: string; title: string; kez: number; gun?: string; istasyon?: number };
type Rekorlar = {
  gunRekoru: (SarkiRekor & { gun: string }) | null;
  geceKrali: SarkiRekor | null;
  sabahSampiyonu: SarkiRekor | null;
  genisYayilim: { artist: string; title: string; istasyon: number } | null;
  sadikIliski: { artist: string; title: string; istasyon: string; kez: number } | null;
  arsiv: { toplam: number; ilk: string } | null;
};

function gunYaz(g: string): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" })
    .format(new Date(`${g}T12:00:00+03:00`));
}

function Kart({ etiket, deger, alt, artist }: { etiket: string; deger: string; alt: string; artist?: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line-hi)", background: "color-mix(in srgb, var(--glow) 5%, var(--panel))" }}>
      <div className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--glow-hi)" }}>
        {etiket}
      </div>
      <p className="mt-2 text-lg font-bold leading-snug">
        {artist ? (
          <Link href={`/sanatci/${sarkiSlug(artist)}`} className="hover:underline">{deger}</Link>
        ) : deger}
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{alt}</p>
    </div>
  );
}

export default async function Sayfa() {
  let r: Rekorlar | null = null;
  try {
    const { data } = await getSupabase().rpc("rekorlar");
    r = (data as Rekorlar | null) ?? null;
  } catch { /* boş vitrinle düş */ }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
        <Link href="/" className="nav-link">ŞİMDİ</Link> · arşivin uç değerleri
      </p>
      <h1 className="brand mt-2 text-4xl font-bold leading-tight">🏆 RADYO REKORLARI</h1>
      {r?.arsiv && (
        <p className="epigraf mt-3 text-base">
          {Number(r.arsiv.toplam).toLocaleString("tr-TR")} kayıtlı çalma üzerinden;
          arşiv {new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(r.arsiv.ilk))}&apos;den beri tutuluyor.
        </p>
      )}

      <div className="mt-8 grid gap-4">
        {r?.gunRekoru && (
          <Kart
            etiket="⚡ Bir günün rekoru"
            deger={`${r.gunRekoru.artist} — ${r.gunRekoru.title}`}
            alt={`${gunYaz(r.gunRekoru.gun)} günü Türkiye radyolarında ${r.gunRekoru.kez} kez çaldı — 24 saatin zirvesi.`}
            artist={r.gunRekoru.artist}
          />
        )}
        {r?.geceKrali && (
          <Kart
            etiket="🌙 Gecenin kralı (00:00–06:00)"
            deger={`${r.geceKrali.artist} — ${r.geceKrali.title}`}
            alt={`Son 30 gecede ${r.geceKrali.kez} kez — uykusuzların ortak şarkısı.`}
            artist={r.geceKrali.artist}
          />
        )}
        {r?.sabahSampiyonu && (
          <Kart
            etiket="☀️ Sabahın şampiyonu (06:00–10:00)"
            deger={`${r.sabahSampiyonu.artist} — ${r.sabahSampiyonu.title}`}
            alt={`Son 30 sabahta ${r.sabahSampiyonu.kez} kez — Türkiye işe bununla gidiyor.`}
            artist={r.sabahSampiyonu.artist}
          />
        )}
        {r?.genisYayilim && (
          <Kart
            etiket="📡 En geniş yayılım"
            deger={`${r.genisYayilim.artist} — ${r.genisYayilim.title}`}
            alt={`Son 30 günde ${r.genisYayilim.istasyon} farklı istasyonda çaldı — bantta kaçışı yok.`}
            artist={r.genisYayilim.artist}
          />
        )}
        {r?.sadikIliski && (
          <Kart
            etiket="💘 En sadık ilişki"
            deger={`${r.sadikIliski.istasyon} ↔ ${r.sadikIliski.title}`}
            alt={`${r.sadikIliski.istasyon}, ${r.sadikIliski.artist} — ${r.sadikIliski.title}'i son 30 günde ${r.sadikIliski.kez} kez çaldı. Bu bir aşk.`}
            artist={r.sadikIliski.artist}
          />
        )}
        {!r && (
          <p className="epigraf text-base">rekor defteri şu an açılamadı — birazdan yine dene.</p>
        )}
      </div>

      <p className="mono mt-8 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
        <Link href="/liste" className="nav-link">canlı liste →</Link>{" "}
        <Link href="/endeks" className="nav-link">aylık endeks →</Link>
      </p>
    </main>
  );
}
