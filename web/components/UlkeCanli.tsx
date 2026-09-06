"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* Ülke sayfası canlı şeridi — "şu an bu ülkede çalanlar".
   /api/now'dan ülkenin istasyonlarını süzer, 30 sn'de bir tazeler. */

type Satir = {
  slug: string;
  name: string;
  accentColor: string | null;
  parca: string;
};

export default function UlkeCanli({ sluglar }: { sluglar: string[] }) {
  const [satirlar, setSatirlar] = useState<Satir[]>([]);

  useEffect(() => {
    let durdu = false;
    const set = new Set(sluglar);
    async function yukle() {
      try {
        const r = await fetch("/api/now");
        const d = await r.json();
        type ApiSt = { slug: string; name: string; accentColor: string | null; nowPlaying: { artist: string | null; title: string | null } | null };
        const canli: Satir[] = ((d.stations ?? []) as ApiSt[])
          .filter((s) => set.has(s.slug) && s.nowPlaying?.title)
          .slice(0, 10)
          .map((s) => ({
            slug: s.slug,
            name: s.name,
            accentColor: s.accentColor,
            parca: [s.nowPlaying!.artist, s.nowPlaying!.title].filter(Boolean).join(" — "),
          }));
        if (!durdu) setSatirlar(canli);
      } catch {
        /* sessizce geç — sunucu listesi zaten görünür */
      }
    }
    yukle();
    const id = setInterval(yukle, 30000);
    return () => { durdu = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sluglar.join(",")]);

  if (satirlar.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        <span className="live-dot inline-block h-2 w-2 rounded-full" style={{ background: "#3ddc84" }} />
        şu an bu ülkede çalanlar
      </h2>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {satirlar.map((s) => (
          <Link
            key={s.slug}
            href={`/radyo/${s.slug}`}
            className="press shrink-0 rounded-xl border px-3 py-2"
            style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--fg) 3%, transparent)", maxWidth: 260 }}
          >
            <span className="block truncate text-[13px] font-semibold" suppressHydrationWarning>{s.parca}</span>
            <span className="block truncate text-xs" style={{ color: s.accentColor || "var(--muted)" }}>{s.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
