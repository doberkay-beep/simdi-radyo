"use client";

import { useMemo } from "react";
import { useDil } from "@/lib/i18n";
import { CanliSayac, CanliListe, type AnaOzet } from "./CanliVitrin";

// KADRAN masaüstü konsolu — geniş ekranda (≥1280px) merkez kolonun sağ/soluna
// modül rayları: solda ayın canlı endeks sayacı, sağda son 3 saatin listesi +
// favoriler. Dar ekranda gizli; aynı vitrin NowList'te arama kutusunun üstünde.

type Stn = {
  slug: string;
  name: string;
  city: string | null;
  frequency: string | null;
  accentColor: string | null;
  band: "tr" | "int" | "own";
  genre: string | null;
  nowPlaying: { artist: string | null; title: string | null; updatedAt: string } | null;
};

function Baslik({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mono mb-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
      {children}
    </h3>
  );
}

export default function KonsolRaylar({
  stations,
  anaOzet,
  canliArtis,
  favSlugs,
  playing,
  onTune,
}: {
  stations: Stn[];
  anaOzet: AnaOzet | null;
  canliArtis: number;
  favSlugs: string[];
  playing: string | null;
  onTune: (slug: string) => void;
}) {
  const { dil } = useDil();
  const en = dil === "en";
  const adMap = useMemo(() => {
    const m = new Map<string, Stn>();
    for (const s of stations) m.set(s.slug, s);
    return m;
  }, [stations]);

  const favStations = useMemo(
    () => favSlugs.map((s) => adMap.get(s)).filter(Boolean) as Stn[],
    [favSlugs, adMap]
  );

  function Satir({ s }: { s: Stn }) {
    const c = s.accentColor || "var(--glow)";
    const oynuyor = playing === s.slug;
    return (
      <button
        onClick={() => onTune(s.slug)}
        className="press flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left"
        style={{ background: oynuyor ? "color-mix(in srgb, var(--fg) 6%, transparent)" : "transparent" }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c, boxShadow: oynuyor ? `0 0 8px ${c}` : "none" }} />
        <span className="min-w-0 flex-1">
          <span className="dial block truncate text-[13px] uppercase tracking-[0.02em]">{s.name}</span>
          {s.nowPlaying?.title ? (
            <span className="block truncate text-[11px]" style={{ color: "var(--muted)" }}>
              {[s.nowPlaying.artist, s.nowPlaying.title].filter(Boolean).join(" — ")}
            </span>
          ) : null}
        </span>
      </button>
    );
  }

  return (
    <>
      {/* SOL RAY — ayın canlı endeks sayacı */}
      <aside className="konsol-ray sol" aria-label={en ? "console — left" : "konsol — sol"}>
        <CanliSayac veri={anaOzet} artis={canliArtis} />
      </aside>

      {/* SAĞ RAY — son 3 saatin listesi + favoriler (varsa) */}
      <aside className="konsol-ray sag" aria-label={en ? "console — right" : "konsol — sağ"}>
        <CanliListe veri={anaOzet} />
        {favStations.length > 0 && (
          <section className="surf p-4">
            <Baslik>{en ? "your favorites ★" : "favorilerin ★"}</Baslik>
            <div className="flex flex-col gap-0.5">
              {favStations.slice(0, 8).map((s) => <Satir key={s.slug} s={s} />)}
            </div>
          </section>
        )}
      </aside>
    </>
  );
}
