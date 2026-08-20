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
type Mood = { tur: string; adet: number; oran: number };
type Hour = { saat: number; adet: number };
type Trend = { title: string; artist: string | null; son: number; onceki: number };
type Data = {
  simultaneous: Sim[];
  todaySongs: Song[];
  todayArtists: Artist[];
  moods?: Mood[];
  calanToplam?: number;
  hourly?: Hour[];
  trend?: Trend[];
};

// Tür → renk (ruh halini görselleştirmek için).
const TUR_RENK: Record<string, string> = {
  arabesk: "#9c5f7c",
  caz: "#b98a4a",
  türkü: "#7d9a5a",
  nostalji: "#8a7ab0",
  rock: "#c6503a",
  klasik: "#6a86b8",
  elektronik: "#4a90d6",
  "türkçe pop": "#c65a8a",
  pop: "#e04a7a",
  alternatif: "#5f8f8a",
  tsm: "#b0708a",
  metal: "#8a5a5a",
};

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

        {/* Türkiye'nin ruh hali — şu an çalan türlerin dağılımı */}
        {data && data.moods && data.moods.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              şu an Türkiye&apos;nin ruh hali
            </h2>
            {/* Tek çubukta oranlı şerit */}
            <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              {data.moods.map((m) => (
                <div
                  key={m.tur}
                  title={`${m.tur} · ${m.adet}`}
                  style={{ width: `${m.oran * 100}%`, background: TUR_RENK[m.tur] || "var(--accent)" }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              {data.moods.map((m) => (
                <span key={m.tur} className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: TUR_RENK[m.tur] || "var(--accent)" }} />
                  <span>{m.tur}</span>
                  <span style={{ color: "var(--muted)" }}>{Math.round(m.oran * 100)}%</span>
                </span>
              ))}
            </div>
            <p className="epigraf mt-3 text-sm">
              {data.calanToplam ?? 0} istasyonda şu an müzik var
              {data.moods[0] ? ` — en baskın ses: ${data.moods[0].tur}.` : "."}
            </p>
          </section>
        )}

        {/* Yükselen — son 6 saatte önceki 6 saate göre artanlar */}
        {data && data.trend && data.trend.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              yükselen ↑
            </h2>
            <ul className="flex flex-col gap-2">
              {data.trend.map((t, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: "var(--accent)" }}>
                    ↑
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px]">
                    <span className="font-semibold">{t.artist ?? t.title}</span>
                    {t.artist && t.artist !== t.title && (
                      <span style={{ color: "var(--muted)" }}> — {t.title}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                    {t.onceki} → {t.son}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* En hareketli saat — son 7 gün, saate göre çalma yoğunluğu */}
        {data && data.hourly && data.hourly.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              en hareketli saat (7 gün)
            </h2>
            {(() => {
              const map = new Map(data.hourly!.map((h) => [h.saat, h.adet]));
              const max = Math.max(1, ...data.hourly!.map((h) => h.adet));
              const enCok = data.hourly!.reduce((a, b) => (b.adet > a.adet ? b : a));
              return (
                <>
                  <div className="flex items-end gap-[3px]" style={{ height: 72 }}>
                    {Array.from({ length: 24 }, (_, s) => {
                      const v = map.get(s) ?? 0;
                      return (
                        <div key={s} className="flex flex-1 flex-col items-center justify-end" title={`${s}:00 · ${v}`}>
                          <div
                            className="w-full rounded-t"
                            style={{
                              height: `${Math.max(2, (v / max) * 72)}px`,
                              background: s === enCok.saat ? "var(--accent)" : "color-mix(in srgb, var(--accent) 35%, transparent)",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--muted)" }}>
                    <span>00</span>
                    <span>06</span>
                    <span>12</span>
                    <span>18</span>
                    <span>23</span>
                  </div>
                  <p className="epigraf mt-2 text-sm">
                    en çok {String(enCok.saat).padStart(2, "0")}:00 civarı çalıyor.
                  </p>
                </>
              );
            })()}
          </section>
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
