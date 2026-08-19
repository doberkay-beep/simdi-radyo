"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

type Sim = {
  title: string;
  artist: string | null;
  stations: { slug: string; name: string; accentColor: string | null }[];
};
type Song = { title: string; artist: string | null; adet: number };
type Artist = { artist: string; adet: number };
type Data = { simultaneous: Sim[]; todaySongs: Song[]; todayArtists: Artist[] };

const DEFAULT_ACCENT = "#6b7280";

function ara(q: string) {
  return encodeURIComponent(q);
}

export default function Nabiz() {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/nabiz", { cache: "no-store" });
        const d = await r.json();
        if (!cancelled) {
          setData(d);
          setStatus("idle");
        }
      } catch {
        if (!cancelled) setStatus((s) => (s === "loading" ? "error" : "idle"));
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const top = data?.simultaneous?.[0];
  const maxSong = data?.todaySongs?.[0]?.adet ?? 1;
  const maxArtist = data?.todayArtists?.[0]?.adet ?? 1;

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: "#c2683c" }}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">
              Radyo <span style={{ color: "var(--muted)" }}>Nabzı</span>
            </h1>
            <p className="epigraf mt-2 text-[15px]">Türk radyosunun kalp atışı — canlı.</p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        {/* Canlı vurgu */}
        {top && (
          <div
            className="fade-in mb-8 rounded-2xl border p-5"
            style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
          >
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              şu an tam {top.stations.length} istasyonda birden
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {top.artist && top.artist !== top.title ? `${top.artist} — ${top.title}` : top.title}
            </div>
          </div>
        )}

        {status === "loading" && <p className="epigraf">nabız ölçülüyor…</p>}
        {status === "error" && (
          <p style={{ color: "var(--muted)" }}>Nabız okunamadı. Birazdan tekrar dener.</p>
        )}

        {/* Şu an eşzamanlı */}
        {data && data.simultaneous.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              şu an birden fazla istasyonda
            </h2>
            <ul className="flex flex-col gap-3">
              {data.simultaneous.map((g, i) => (
                <li
                  key={i}
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[17px] font-semibold">
                      {g.artist && g.artist !== g.title ? `${g.artist} — ${g.title}` : g.title}
                    </span>
                    <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      ×{g.stations.length}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.stations.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/radyo/${s.slug}`}
                        className="rounded-full border px-2.5 py-0.5 text-xs"
                        style={{ borderColor: "var(--line)", color: s.accentColor || DEFAULT_ACCENT }}
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Son 24 saatte en çok çalan parçalar */}
        {data && data.todaySongs.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              son 24 saatte en çok çalanlar
            </h2>
            <ol className="flex flex-col gap-2">
              {data.todaySongs.map((s, i) => {
                const q = ara(`${s.artist ?? ""} ${s.title}`.trim());
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className="w-6 shrink-0 text-right text-sm tabular-nums"
                      style={{ color: "var(--muted)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">
                        <span className="font-semibold">{s.artist ?? s.title}</span>
                        {s.artist && s.artist !== s.title && (
                          <span style={{ color: "var(--muted)" }}> — {s.title}</span>
                        )}
                      </span>
                      <span
                        className="mt-1 block h-1 rounded-full"
                        style={{
                          width: `${Math.max(6, (s.adet / maxSong) * 100)}%`,
                          background: "var(--accent)",
                        }}
                      />
                    </span>
                    <a
                      href={`https://open.spotify.com/search/${q}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs underline"
                      style={{ color: "var(--muted)" }}
                    >
                      ▶
                    </a>
                    <span className="w-8 shrink-0 text-right text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                      {s.adet}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* En çok çalan sanatçılar */}
        {data && data.todayArtists.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              en çok çalan sanatçılar (24 saat)
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.todayArtists.map((a, i) => (
                <span
                  key={i}
                  className="rounded-full border px-3 py-1 text-sm"
                  style={{
                    borderColor: "var(--line)",
                    fontSize: `${Math.max(0.8, Math.min(1.4, 0.8 + (a.adet / maxArtist) * 0.6))}rem`,
                  }}
                >
                  {a.artist}{" "}
                  <span style={{ color: "var(--muted)" }}>{a.adet}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Arşiv fonksiyonları henüz kurulmadıysa ipucu */}
        {data && data.todaySongs.length === 0 && data.simultaneous.length === 0 && status === "idle" && (
          <p className="epigraf">Nabız topluyor… birazdan burada bir kalp atacak.</p>
        )}
      </div>
    </div>
  );
}
