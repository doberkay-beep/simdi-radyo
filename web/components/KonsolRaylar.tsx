"use client";

import { useEffect, useMemo, useState } from "react";
import { useDil, turAdi } from "@/lib/i18n";

// KADRAN masaüstü konsolu — geniş ekranda (≥1280px) merkez kolonun sağ/soluna
// modül rayları. Mobilde ve dar ekranda gizlenir (CSS). Veriyi NowList'ten
// (stations, favSlugs) alır; defter akışını kendi çeker (/api/not).

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

type Ani = { id: number; slug: string; not: string; createdAt: string };

function nezaman(iso: string, en: boolean): string {
  const dk = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
  if (dk < 1) return en ? "now" : "az önce";
  if (dk < 60) return en ? `${dk}m` : `${dk} dk`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return en ? `${sa}h` : `${sa} sa`;
  return en ? `${Math.floor(sa / 24)}d` : `${Math.floor(sa / 24)} gün`;
}

function Baslik({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mono mb-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
      {children}
    </h3>
  );
}

export default function KonsolRaylar({
  stations,
  favSlugs,
  playing,
  onTune,
}: {
  stations: Stn[];
  favSlugs: string[];
  playing: string | null;
  onTune: (slug: string) => void;
}) {
  const { t, dil } = useDil();
  const en = dil === "en";
  const [anilar, setAnilar] = useState<Ani[]>([]);

  // Defter akışı — tüm istasyonlardan son anılar.
  useEffect(() => {
    let off = false;
    fetch("/api/not", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !off && setAnilar((d.notlar ?? []).slice(0, 6)))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  const adMap = useMemo(() => {
    const m = new Map<string, Stn>();
    for (const s of stations) m.set(s.slug, s);
    return m;
  }, [stations]);

  // Nabız mini — canlı çalan istasyonların tür dağılımı.
  const turlar = useMemo(() => {
    const say = new Map<string, number>();
    for (const s of stations) {
      if (!s.nowPlaying?.title || !s.genre) continue;
      say.set(s.genre, (say.get(s.genre) || 0) + 1);
    }
    const arr = [...say.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = arr[0]?.[1] || 1;
    return arr.map(([g, n]) => ({ g, n, oran: n / max }));
  }, [stations]);

  const favStations = useMemo(
    () => favSlugs.map((s) => adMap.get(s)).filter(Boolean) as Stn[],
    [favSlugs, adMap]
  );

  const dunya = useMemo(
    () => stations.filter((s) => s.band === "int" && s.nowPlaying?.title).slice(0, 6),
    [stations]
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
      {/* SOL RAY */}
      <aside className="konsol-ray sol" aria-label={en ? "console — left" : "konsol — sol"}>
        <section className="surf p-4">
          <Baslik>{en ? "guestbook · live" : "defter · canlı"}</Baslik>
          {anilar.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {anilar.map((a) => {
                const st = adMap.get(a.slug);
                const c = st?.accentColor || "var(--glow)";
                return (
                  <li key={a.id} className="border-l-2 pl-3" style={{ borderColor: `color-mix(in srgb, ${c} 55%, var(--line))` }}>
                    <p className="read text-[13px] italic" style={{ color: "var(--fg)" }}>&ldquo;{a.not}&rdquo;</p>
                    <p className="mono mt-1 text-[10px]" style={{ color: "var(--faint)" }}>
                      {st?.name || a.slug} · {nezaman(a.createdAt, en)}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[12px]" style={{ color: "var(--faint)" }}>{en ? "no notes yet" : "henüz anı yok"}</p>
          )}
        </section>

        <section className="surf p-4">
          <Baslik>{en ? "pulse · genres now" : "nabız · şu an türler"}</Baslik>
          {turlar.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {turlar.map((x) => (
                <li key={x.g} className="flex items-center gap-2">
                  <span className="dial w-20 shrink-0 truncate text-[12px] uppercase tracking-[0.02em]">{turAdi(dil, x.g)}</span>
                  <span className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--fg) 8%, transparent)" }}>
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${x.oran * 100}%`, background: "var(--glow)" }} />
                  </span>
                  <span className="mono w-5 shrink-0 text-right text-[11px]" style={{ color: "var(--muted)" }}>{x.n}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px]" style={{ color: "var(--faint)" }}>—</p>
          )}
        </section>
      </aside>

      {/* SAĞ RAY */}
      <aside className="konsol-ray sag" aria-label={en ? "console — right" : "konsol — sağ"}>
        <section className="surf p-4">
          <Baslik>{en ? "your favorites ★" : "favorilerin ★"}</Baslik>
          {favStations.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {favStations.slice(0, 8).map((s) => <Satir key={s.slug} s={s} />)}
            </div>
          ) : (
            <p className="text-[12px]" style={{ color: "var(--faint)" }}>
              {en ? "star a station to pin it here" : "bir istasyonu yıldızla, buraya düşsün"}
            </p>
          )}
        </section>

        <section className="surf p-4">
          <Baslik>{en ? "around the world now" : "dünyada şu an"}</Baslik>
          {dunya.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {dunya.map((s) => <Satir key={s.slug} s={s} />)}
            </div>
          ) : (
            <p className="text-[12px]" style={{ color: "var(--faint)" }}>—</p>
          )}
        </section>
      </aside>
    </>
  );
}
