"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type NowPlaying = {
  artist: string | null;
  title: string | null;
  rawTitle: string | null;
  updatedAt: string;
} | null;

type Station = {
  slug: string;
  name: string;
  city: string | null;
  frequency: string | null;
  accentColor: string | null;
  band: "tr" | "int" | "own";
  nowPlaying: NowPlaying;
};

// Bir hex rengin üzerinde siyah mı beyaz mı metin okunur, ona karar verir.
function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0a0a0b" : "#ffffff";
}

// "az önce", "3 dk önce" gibi göreli zaman.
function since(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return "az önce";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  return `${h} sa önce`;
}

const DEFAULT_ACCENT = "#6b7280";

export default function NowList() {
  const [stations, setStations] = useState<Station[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [now, setNow] = useState(0); // göreli zaman için; ilk render'da 0
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/now", { cache: "no-store" });
      const data = await res.json();
      setStations(data.stations ?? []);
      setStatus("idle");
    } catch {
      setStatus((s) => (s === "loading" ? "error" : "idle"));
    }
  }

  useEffect(() => {
    setNow(Date.now());
    load();
    const dataTimer = setInterval(load, 15000);
    const clockTimer = setInterval(() => setNow(Date.now()), 20000);
    return () => {
      clearInterval(dataTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const current = useMemo(
    () => stations.find((s) => s.slug === playing) ?? null,
    [stations, playing],
  );
  const accent = current?.accentColor || DEFAULT_ACCENT;

  function toggle(s: Station) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing === s.slug) {
      audio.pause();
      setPlaying(null);
      return;
    }
    setPlaying(s.slug);
    audio.src = `/api/stream/${s.slug}`;
    audio.play().catch(() => setPlaying(null));
  }

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: accent }}>
      <div className="mx-auto max-w-2xl px-5 pb-32 pt-10">
        {/* Başlık — logo yok, sadece kelime işareti */}
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">ŞİMDİ</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              radyoda şu an ne çalıyor
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
            <span
              className="live-dot inline-block h-2 w-2 rounded-full"
              style={{ background: playing ? accent : "#3ddc84" }}
            />
            canlı
          </div>
        </header>

        {status === "loading" && (
          <p style={{ color: "var(--muted)" }}>Yükleniyor…</p>
        )}
        {status === "error" && (
          <p style={{ color: "var(--muted)" }}>
            Bağlanılamadı. Toplayıcı ve API çalışıyor mu?
          </p>
        )}

        <ul className="flex flex-col">
          {stations.map((s) => {
            const np = s.nowPlaying;
            const isPlaying = playing === s.slug;
            const c = s.accentColor || DEFAULT_ACCENT;
            const artist = np?.artist?.trim() || null;
            const title = np?.title?.trim() || null;
            // Sanatçı = parça ise (ayrılamamış) tek satır göster.
            const sameArtistTitle = artist && title && artist === title;

            return (
              <li key={s.slug}>
                <button
                  onClick={() => toggle(s)}
                  className="group flex w-full items-center gap-4 border-b py-4 text-left transition-colors"
                  style={{
                    borderColor: "var(--line)",
                    background: isPlaying
                      ? `color-mix(in srgb, ${c} 12%, transparent)`
                      : "transparent",
                  }}
                >
                  {/* Renk çubuğu + çalma göstergesi */}
                  <span className="flex h-10 w-6 shrink-0 items-center justify-center">
                    {isPlaying ? (
                      <span className="eq flex items-end gap-[2px]" aria-hidden>
                        <span /><span /><span /><span />
                      </span>
                    ) : (
                      <span
                        className="h-8 w-[3px] rounded-full opacity-70 transition-opacity group-hover:opacity-100"
                        style={{ background: c }}
                      />
                    )}
                  </span>

                  {/* Parça ön planda, istasyon ikincil */}
                  <span className="min-w-0 flex-1">
                    {np ? (
                      sameArtistTitle ? (
                        <span className="block truncate text-[17px] font-semibold">{title}</span>
                      ) : (
                        <span className="block truncate text-[17px]">
                          <span className="font-semibold">{artist ?? title}</span>
                          {artist && title && (
                            <span style={{ color: "var(--muted)" }}> — {title}</span>
                          )}
                        </span>
                      )
                    ) : (
                      <span className="block text-[17px]" style={{ color: "var(--muted)" }}>
                        —
                      </span>
                    )}
                    <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--muted)" }}>
                      <span style={{ color: c }}>{s.name}</span>
                      {s.frequency ? ` · ${s.frequency}` : ""}
                      {s.city ? ` · ${s.city}` : ""}
                      {np ? ` · ${since(np.updatedAt, now || Date.now())}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Alt çalma çubuğu — çalan istasyonun renginde */}
      {current && (
        <div
          className="fixed inset-x-0 bottom-0 z-10 border-t"
          style={{ background: accent, borderColor: "rgba(255,255,255,0.15)" }}
        >
          <div
            className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-3"
            style={{ color: readableOn(accent) }}
          >
            <button
              onClick={() => toggle(current)}
              aria-label="Durdur"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.18)", color: readableOn(accent) }}
            >
              {/* pause simgesi */}
              <span className="flex gap-[3px]">
                <span className="h-4 w-[3px] rounded-sm" style={{ background: readableOn(accent) }} />
                <span className="h-4 w-[3px] rounded-sm" style={{ background: readableOn(accent) }} />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {current.nowPlaying
                  ? current.nowPlaying.artist && current.nowPlaying.title &&
                    current.nowPlaying.artist !== current.nowPlaying.title
                    ? `${current.nowPlaying.artist} — ${current.nowPlaying.title}`
                    : current.nowPlaying.title || current.nowPlaying.rawTitle
                  : "—"}
              </div>
              <div className="truncate text-xs opacity-80">{current.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Sadece bu satırdan ses çıkar; görünmez */}
      <audio ref={audioRef} onEnded={() => setPlaying(null)} onError={() => setPlaying(null)} />
    </div>
  );
}
