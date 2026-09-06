"use client";

import { useEffect, useMemo, useState } from "react";
import { ULKELER, SAAT_DILIMI, istasyonUlkesi, bayrakEmoji, type UlkeKodu } from "@/lib/ulkeler";

/* "Dünyada şu an" — rastgele 5 ülkeden o an çalanlar, yerel saatleriyle.
   Veri NowList'in elindeki istasyon listesinden gelir; 30 sn'de bir karılır. */

const COP_PARCA = /use http|www\.|https?:|\.com|\.net\b/i;

type Ist = {
  slug: string;
  name: string;
  band: string;
  accentColor: string | null;
  nowPlaying: { artist: string | null; title: string | null } | null;
};

function saatVeDurum(tz: string): string {
  try {
    const s = new Date();
    const saat = new Intl.DateTimeFormat("tr-TR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(s);
    const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(s));
    const durum = h < 6 ? "gece" : h < 11 ? "sabah" : h < 17 ? "gündüz" : h < 22 ? "akşam" : "gece";
    return `${saat} · ${durum}`;
  } catch {
    return "";
  }
}

export default function DunyadaSimdi({ stations, onTune }: { stations: Ist[]; onTune: (slug: string) => void }) {
  const [tohum, setTohum] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTohum((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const kartlar = useMemo(() => {
    const gruplar = new Map<UlkeKodu, Ist[]>();
    for (const s of stations) {
      if (s.band !== "int" || !s.nowPlaying?.title) continue;
      if (COP_PARCA.test(s.nowPlaying.title)) continue;
      const k = istasyonUlkesi(s.slug);
      if (!gruplar.has(k)) gruplar.set(k, []);
      gruplar.get(k)!.push(s);
    }
    const ulkeler = [...gruplar.keys()];
    // tohuma bağlı karıştırma — her 30 sn'de başka bir dünya kesiti
    for (let i = ulkeler.length - 1; i > 0; i--) {
      const j = (i * 2654435761 + tohum * 97) % (i + 1);
      [ulkeler[i], ulkeler[j]] = [ulkeler[j], ulkeler[i]];
    }
    return ulkeler.slice(0, 5).map((k) => {
      const adaylar = gruplar.get(k)!;
      const s = adaylar[(tohum + adaylar.length) % adaylar.length];
      return { k, s };
    });
  }, [stations, tohum]);

  if (kartlar.length === 0) return null;

  return (
    <div className="mb-4">
      <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        <span aria-hidden>🌍</span> dünyada şu an
      </h2>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {kartlar.map(({ k, s }) => (
          <button
            key={s.slug}
            onClick={() => onTune(s.slug)}
            className="press shrink-0 rounded-xl border px-3 py-2 text-left"
            style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--fg) 3%, transparent)", maxWidth: 250 }}
            title={`${s.name} — çal`}
          >
            <span className="block truncate text-xs" style={{ color: "var(--muted)" }} suppressHydrationWarning>
              {bayrakEmoji(k)} {ULKELER[k].tr}{SAAT_DILIMI[k] ? ` · ${saatVeDurum(SAAT_DILIMI[k]!)}` : ""}
            </span>
            <span className="block truncate text-[13px] font-semibold" suppressHydrationWarning>
              {[s.nowPlaying!.artist, s.nowPlaying!.title].filter(Boolean).join(" — ")}
            </span>
            <span className="block truncate text-xs" style={{ color: s.accentColor || "var(--muted)" }}>{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
