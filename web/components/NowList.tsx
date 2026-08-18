"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

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
  genre: string | null;
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

// Şarkı bilgisi vermeyen istasyonlar için türe uygun "havalı" cümleler.
const TAGLINES: Record<string, string[]> = {
  caz: ["kadehler, duman ve saksofon", "gece yarısı bir kulüpte", "swing'in tam kıvamı"],
  klasik: ["yaylılar ve sonsuzluk", "bir konser salonunun sükûneti", "notaların en zarifi"],
  elektronik: ["şafağa kadar süren bir set", "bas, ışık, tekrar", "dört dörtlük bir groove"],
  rock: ["gitarlar sonuna kadar açık", "distortion ve ter", "sahnenin en önü"],
  metal: ["duvarları titreten riffler", "sonuna kadar aç"],
  pop: ["radyonun en parlak yüzü", "nakaratı hazır tut", "listelerin zirvesi"],
  "türkçe pop": ["camlar açık, yol uzun", "en sevilen nakaratlar", "hepimizin şarkısı"],
  türkü: ["bir bağlama, bir uzun hava", "toprak kokan ezgiler", "yürekten yakılan türküler"],
  arabesk: ["bir sigara, bir dert, bir şarkı", "gecenin en hüzünlü sesi", "kalbe dokunan sözler"],
  tsm: ["makamlar ve incelik", "bir başka zarafet"],
  nostalji: ["eski bir kasetin sıcaklığı", "yıllar öncesine bir bilet", "unutulmayanlar"],
  alternatif: ["keşfedilmeyi bekleyen sesler", "listelerin dışında bir yer", "farklı bir frekans"],
};
const DEFAULT_TAGLINES = ["müzik hiç durmaz", "sadece dinle", "frekans açık"];

// Slug'a göre sabit (titremeyen) cümle seç.
function tagline(genre: string | null, slug: string): string {
  const pool = (genre && TAGLINES[genre]) || DEFAULT_TAGLINES;
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

export default function NowList() {
  const [stations, setStations] = useState<Station[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [now, setNow] = useState(0); // göreli zaman için; ilk render'da 0
  const [genre, setGenre] = useState<string | null>(null); // seçili tür filtresi
  // Çalan istasyonun CANLI çalan bilgisi (toplayıcıdan değil, anlık yoklamadan).
  const [liveNP, setLiveNP] = useState<NowPlaying>(null);
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

  // Çalan istasyonu anlık yokla → dinlenenle yazı eşleşsin (toplayıcı ~15 dk'da
  // bir güncellediği için liste eskiyebiliyor; çalınan istasyon canlı olur).
  useEffect(() => {
    if (!playing) {
      setLiveNP(null);
      return;
    }
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const r = await fetch(`/api/live/${playing}`, { cache: "no-store" });
        const d = await r.json();
        if (!cancelled) setLiveNP(d.live ?? null);
      } catch {
        // sessizce geç
      }
    };
    setLiveNP(null);
    fetchLive();
    const id = setInterval(fetchLive, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [playing]);

  const current = useMemo(
    () => stations.find((s) => s.slug === playing) ?? null,
    [stations, playing],
  );
  const accent = current?.accentColor || DEFAULT_ACCENT;

  // Türleri say, çoktan aza sırala (filtre çipleri için).
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of stations) {
      if (s.genre) counts.set(s.genre, (counts.get(s.genre) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [stations]);

  // Seçili türe göre süz.
  const shown = useMemo(
    () => (genre ? stations.filter((s) => s.genre === genre) : stations),
    [stations, genre],
  );

  // Kilit ekranı / medya kontrolleri: sayfa başlığı yerine gerçek şarkı +
  // istasyon + uygulama ikonunu göster (telefonda arka planda çalarken).
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (!current) {
      ms.metadata = null;
      ms.playbackState = "none";
      return;
    }
    const np = liveNP ?? current.nowPlaying;
    const track =
      np && np.artist && np.title && np.artist !== np.title
        ? `${np.artist} — ${np.title}`
        : (np && (np.title || np.rawTitle)) || "canlı yayın";
    try {
      ms.metadata = new MediaMetadata({
        title: track,
        artist: current.name,
        album: "ŞİMDİ",
        artwork: [
          { src: "/icon.png", sizes: "512x512", type: "image/png" },
          { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
        ],
      });
      ms.playbackState = "playing";
    } catch {
      // MediaMetadata desteklenmiyorsa sessizce geç
    }
  }, [current, liveNP]);

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
          <div className="flex flex-col items-end gap-1 text-xs" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-3">
              <ThemeToggle />
              <span className="flex items-center gap-2">
                <span
                  className="live-dot inline-block h-2 w-2 rounded-full"
                  style={{ background: playing ? accent : "#3ddc84" }}
                />
                canlı
              </span>
            </span>
            <Link href="/arsiv" className="underline" style={{ color: "var(--muted)" }}>
              arşiv →
            </Link>
          </div>
        </header>

        {/* Tür filtresi çipleri */}
        {genres.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {[null, ...genres].map((g) => {
              const active = genre === g;
              return (
                <button
                  key={g ?? "all"}
                  onClick={() => setGenre(g)}
                  className="rounded-full border px-3 py-1 text-xs transition-colors"
                  style={{
                    borderColor: active ? "var(--fg)" : "var(--line)",
                    background: active ? "var(--fg)" : "transparent",
                    color: active ? "var(--bg)" : "var(--muted)",
                  }}
                >
                  {g ?? "tümü"}
                </button>
              );
            })}
          </div>
        )}

        {status === "loading" && (
          <p style={{ color: "var(--muted)" }}>Yükleniyor…</p>
        )}
        {status === "error" && (
          <p style={{ color: "var(--muted)" }}>
            Bağlanılamadı. Toplayıcı ve API çalışıyor mu?
          </p>
        )}

        <ul className="flex flex-col">
          {shown.map((s) => {
            const isPlaying = playing === s.slug;
            // Çalan istasyonda canlı bilgi varsa onu göster (taze), yoksa toplayıcıdan.
            const np = isPlaying && liveNP ? liveNP : s.nowPlaying;
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
                      <span
                        className="block truncate text-[17px] italic"
                        style={{ color: "var(--muted)" }}
                      >
                        {tagline(s.genre, s.slug)}
                      </span>
                    )}
                    <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--muted)" }}>
                      <span style={{ color: c }}>{s.name}</span>
                      {s.frequency ? ` · ${s.frequency}` : ""}
                      {s.city ? ` · ${s.city}` : ""}
                      {np
                        ? isPlaying && liveNP
                          ? " · canlı"
                          : np.updatedAt
                            ? ` · ${since(np.updatedAt, now || Date.now())}`
                            : ""
                        : ""}
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
                {(() => {
                  // Canlı bilgi varsa onu göster (dinlenenle eşleşsin).
                  const np = liveNP ?? current.nowPlaying;
                  if (!np) return tagline(current.genre, current.slug);
                  return np.artist && np.title && np.artist !== np.title
                    ? `${np.artist} — ${np.title}`
                    : np.title || np.rawTitle;
                })()}
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
