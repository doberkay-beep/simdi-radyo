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
const FAV_KEY = "favoriler";

// Yabancı istasyonların bayrağı (slug'a göre). Yeni yabancı eklenince buraya da eklenir.
const FLAG: Record<string, string> = {
  kexp: "🇺🇸",
  fip: "🇫🇷",
  "nts-1": "🇬🇧",
  los40: "🇪🇸",
  "radio-number-one": "🇮🇹",
  "virgin-radio-italia": "🇮🇹",
  "tsf-jazz": "🇫🇷",
  "radio-swiss-classic": "🇨🇭",
  "radio-paradise": "🇺🇸",
  "radio-paradise-rock": "🇺🇸",
  "somafm-groove-salad": "🇺🇸",
  "somafm-indie-pop": "🇺🇸",
  "somafm-secret-agent": "🇺🇸",
  "somafm-metal": "🇺🇸",
  "diana-krall": "🇺🇸",
  "italo-power": "🇮🇹",
};

// Günün saatine göre selamlama.
function greeting(h: number): string {
  if (h < 6) return "İyi geceler";
  if (h < 11) return "Günaydın";
  if (h < 18) return "İyi günler";
  if (h < 22) return "İyi akşamlar";
  return "İyi geceler";
}
const pad2 = (n: number) => String(n).padStart(2, "0");

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

// Çalan parçadan Spotify/YouTube araması için sorgu üret.
function trackQuery(np: NowPlaying): string | null {
  if (!np) return null;
  const a = np.artist?.trim() || null;
  const t = np.title?.trim() || null;
  if (a && t && a !== t) return `${a} ${t}`;
  return t || np.rawTitle || null;
}

const low = (s: string) => s.toLocaleLowerCase("tr");

export default function NowList() {
  const [stations, setStations] = useState<Station[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [now, setNow] = useState(0); // göreli zaman için; ilk render'da 0
  const [genre, setGenre] = useState<string | null>(null); // seçili tür filtresi
  const [query, setQuery] = useState(""); // isimle arama
  const [region, setRegion] = useState<"all" | "tr" | "int">("all"); // ülke ayrımı
  const [featuredSlug, setFeaturedSlug] = useState<string | null>(null); // "ne dinlesem" önerisi
  const [favs, setFavs] = useState<Set<string>>(new Set()); // favori slug'lar
  const [phase, setPhase] = useState<"idle" | "connecting" | "playing" | "error">("idle");
  const [sleepUntil, setSleepUntil] = useState<number | null>(null); // uyku zamanlayıcı
  // Çalan istasyonun CANLI çalan bilgisi (toplayıcıdan değil, anlık yoklamadan).
  const [liveNP, setLiveNP] = useState<NowPlaying>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Otomatik yeniden bağlanma için: dinlenmek istenen istasyon ve deneme sayacı.
  const playingRef = useRef<string | null>(null);
  const retriesRef = useRef(0);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const giveUpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Deep link (?ist=slug) ile açılınca o istasyonu bir kez çalmayı dene.
  const deepLinkRef = useRef<string | null>(null);
  const deepTriedRef = useRef(false);

  // Favorileri yükle (localStorage).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {
      // yok say
    }
  }, []);

  function toggleFav(slug: string) {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {
        // yok say
      }
      return next;
    });
  }

  // Yayın kesilirse (üst akış düşer, ağ takılır, ekran uyanır) kendiliğinden
  // yeniden bağlan. Gerçekten ölü istasyonda birkaç denemeden sonra vazgeç.
  function reconnect() {
    const audio = audioRef.current;
    const slug = playingRef.current;
    if (!audio || !slug) return;
    if (retriesRef.current >= 6) {
      setPhase("error");
      if (giveUpRef.current) clearTimeout(giveUpRef.current);
      giveUpRef.current = setTimeout(() => setPlaying(null), 2600);
      return;
    }
    retriesRef.current += 1;
    setPhase("connecting");
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    reconnectRef.current = setTimeout(() => {
      if (playingRef.current !== slug) return;
      audio.src = `/api/stream/${slug}?r=${Date.now()}`;
      audio.play().catch(() => {});
    }, 800);
  }

  // Dinlenmek istenen istasyonu takip et; yeni seçimde sayacı sıfırla.
  useEffect(() => {
    playingRef.current = playing;
    if (playing) retriesRef.current = 0;
    if (!playing) setPhase("idle");
  }, [playing]);

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
    try {
      const ist = new URLSearchParams(window.location.search).get("ist");
      if (ist) deepLinkRef.current = ist;
    } catch {
      // yok say
    }
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

  // Ülke + tür + arama süz, sonra favorileri en üste al.
  const shown = useMemo(() => {
    const q = low(query.trim());
    let list = stations;
    if (region !== "all") {
      list = list.filter((s) => (region === "int" ? s.band === "int" : s.band !== "int"));
    }
    if (genre) list = list.filter((s) => s.genre === genre);
    if (q) {
      list = list.filter((s) =>
        [s.name, s.city, s.frequency, s.genre].some((v) => v && low(v).includes(q)),
      );
    }
    // Favoriler üstte (kararlı sıra).
    return [...list].sort((a, b) => Number(favs.has(b.slug)) - Number(favs.has(a.slug)));
  }, [stations, region, genre, query, favs]);

  // Ülkeye göre sayılar (segment etiketleri için).
  const trCount = useMemo(() => stations.filter((s) => s.band !== "int").length, [stations]);
  const intCount = useMemo(() => stations.filter((s) => s.band === "int").length, [stations]);

  // "Ne dinlesem?" — liste gelince rastgele bir istasyon öner.
  useEffect(() => {
    if (!featuredSlug && stations.length) {
      setFeaturedSlug(stations[Math.floor(Math.random() * stations.length)].slug);
    }
  }, [stations, featuredSlug]);
  const featured = useMemo(
    () => stations.find((s) => s.slug === featuredSlug) ?? null,
    [stations, featuredSlug],
  );
  function suggestAnother() {
    if (stations.length) setFeaturedSlug(stations[Math.floor(Math.random() * stations.length)].slug);
  }

  // "Şu an çalanlar" şeridi — gerçekten parça bilgisi olan istasyonlar.
  const nowStrip = useMemo(
    () => stations.filter((s) => s.nowPlaying && (s.nowPlaying.title || s.nowPlaying.artist)).slice(0, 14),
    [stations],
  );

  // Saat (Türkiye saati = kullanıcının cihaz saati). now ile ~20 sn'de tazelenir.
  const clockD = new Date(now || Date.now());
  const clock = `${pad2(clockD.getHours())}:${pad2(clockD.getMinutes())}`;
  const selam = greeting(clockD.getHours());

  // Deep link ile gelen istasyonu bir kez çalmayı dene (liste yüklenince).
  useEffect(() => {
    if (deepTriedRef.current || !deepLinkRef.current || playing) return;
    const s = stations.find((x) => x.slug === deepLinkRef.current);
    if (s) {
      deepTriedRef.current = true;
      toggle(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  // Uyku zamanlayıcı: süre dolunca yayını durdur.
  useEffect(() => {
    if (!sleepUntil) return;
    const ms = sleepUntil - Date.now();
    if (ms <= 0) {
      audioRef.current?.pause();
      setPlaying(null);
      setSleepUntil(null);
      return;
    }
    const id = setTimeout(() => {
      audioRef.current?.pause();
      setPlaying(null);
      setSleepUntil(null);
    }, ms);
    return () => clearTimeout(id);
  }, [sleepUntil]);

  function cycleSleep() {
    // kapalı → 15 → 30 → 60 → kapalı
    const remain = sleepUntil ? Math.ceil((sleepUntil - Date.now()) / 60000) : 0;
    const nextMin = remain <= 0 ? 15 : remain <= 15 ? 30 : remain <= 30 ? 60 : 0;
    setSleepUntil(nextMin ? Date.now() + nextMin * 60000 : null);
  }
  const sleepRemain = sleepUntil ? Math.max(0, Math.ceil((sleepUntil - (now || Date.now())) / 60000)) : 0;

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

  // Tarayıcı tema rengi (mobil adres çubuğu) çalan istasyona göre boyansın.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", playing ? accent : "#0a0a0b");
  }, [accent, playing]);

  function toggle(s: Station) {
    const audio = audioRef.current;
    if (!audio) return;
    if (giveUpRef.current) clearTimeout(giveUpRef.current);
    if (playing === s.slug) {
      audio.pause();
      setPlaying(null);
      return;
    }
    setPlaying(s.slug);
    setPhase("connecting");
    audio.src = `/api/stream/${s.slug}`;
    audio.play().catch(() => {
      // Otomatik çalma engellendiyse (deep link) sessizce bırak.
      setPlaying(null);
    });
  }

  // Alt çubuktaki parça metni (canlı bilgi öncelikli).
  const barNp = current ? liveNP ?? current.nowPlaying : null;
  const barQuery = trackQuery(barNp);

  return (
    <div
      className={`spread min-h-screen ${playing ? "" : "aurora"}`}
      style={playing ? { ["--accent" as string]: accent } : undefined}
    >
      {/* Geniş ekranda yan boşluklara çok soluk dev kelime işareti (ambient). */}
      <div
        aria-hidden
        className="brand pointer-events-none fixed inset-0 z-0 hidden select-none items-center justify-center overflow-hidden lg:flex"
      >
        <span
          style={{
            fontSize: "40vw",
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: "var(--fg)",
            opacity: 0.03,
          }}
        >
          ŞİMDİ
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-5 pb-32 pt-10">
        {/* Başlık — logo yok, sadece kelime işareti */}
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="brand text-[42px] font-bold leading-none tracking-tight">ŞİMDİ</h1>
            <span
              className="title-underline mt-2 block h-[2px] rounded-full"
              style={{ width: 40, background: accent, opacity: playing ? 1 : 0.25 }}
            />
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              radyoda şu an ne çalıyor
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-3">
              <button
                onClick={cycleSleep}
                title="uyku zamanlayıcı"
                aria-label="uyku zamanlayıcı"
                className="leading-none"
                style={{ color: sleepUntil ? "var(--fg)" : "var(--muted)" }}
              >
                {sleepUntil ? `🌙 ${sleepRemain}dk` : "🌙"}
              </button>
              <ThemeToggle />
              <span className="flex items-center gap-2">
                <span
                  className="live-dot inline-block h-2 w-2 rounded-full"
                  style={{ background: playing ? accent : "#3ddc84" }}
                />
                canlı
              </span>
            </span>
            <span className="flex items-center gap-3">
              <Link href="/hakkinda" className="underline" style={{ color: "var(--muted)" }}>
                geliştirici
              </Link>
              <Link href="/arsiv" className="underline" style={{ color: "var(--muted)" }}>
                arşiv →
              </Link>
            </span>
          </div>
        </header>

        {/* Selamlama + saat + sayaçlar */}
        {now > 0 && (
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
            {selam} · {clock} · {stations.length} radyo · {genres.length} tür
          </p>
        )}

        {/* Arama */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İstasyon ara…"
          className="mb-4 w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
          style={{ background: "transparent", borderColor: "var(--line)", color: "var(--fg)" }}
        />

        {/* Ülke ayrımı: Tümü / Türkiye / Yabancı */}
        <div
          className="mb-4 inline-flex rounded-full border p-0.5 text-xs"
          style={{ borderColor: "var(--line)" }}
        >
          {(
            [
              ["all", `Tümü ${stations.length}`],
              ["tr", `Türkiye ${trCount}`],
              ["int", `Yabancı ${intCount}`],
            ] as const
          ).map(([key, label]) => {
            const active = region === key;
            return (
              <button
                key={key}
                onClick={() => setRegion(key)}
                className="rounded-full px-3 py-1 transition-colors"
                style={{
                  background: active ? "var(--fg)" : "transparent",
                  color: active ? "var(--bg)" : "var(--muted)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

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

        {/* "Ne dinlesem?" — boştayken rastgele bir istasyon öner */}
        {!playing && featured && (
          (() => {
            const fc = featured.accentColor || DEFAULT_ACCENT;
            return (
              <div
                className="mb-5 flex items-center gap-4 rounded-2xl border p-4"
                style={{
                  borderColor: "var(--line)",
                  background: `color-mix(in srgb, ${fc} 10%, transparent)`,
                }}
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${fc}, color-mix(in srgb, ${fc} 50%, #000))`,
                    color: readableOn(fc),
                  }}
                >
                  {featured.name.trim().charAt(0).toLocaleUpperCase("tr")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    ne dinlesem?{" "}
                    <button onClick={suggestAnother} className="underline">
                      başka öner
                    </button>
                  </span>
                  <span className="block truncate text-lg font-semibold">{featured.name}</span>
                  <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>
                    {[featured.genre, featured.frequency, featured.city].filter(Boolean).join(" · ") || "canlı radyo"}
                  </span>
                </span>
                <button
                  onClick={() => toggle(featured)}
                  className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold"
                  style={{ background: fc, color: readableOn(fc) }}
                >
                  ▶ Çal
                </button>
              </div>
            );
          })()
        )}

        {/* "Şu an çalanlar" yatay şerit */}
        {!playing && nowStrip.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              şu an çalanlar
            </p>
            <div className="no-scrollbar -mx-5 overflow-x-auto px-5">
              <div className="flex gap-2 pb-1">
                {nowStrip.map((s) => {
                  const c = s.accentColor || DEFAULT_ACCENT;
                  const np = s.nowPlaying!;
                  const txt =
                    np.artist && np.title && np.artist !== np.title
                      ? `${np.artist} — ${np.title}`
                      : np.title || np.artist || "";
                  return (
                    <button
                      key={s.slug}
                      onClick={() => toggle(s)}
                      className="shrink-0 rounded-xl border px-3 py-2 text-left"
                      style={{
                        borderColor: "var(--line)",
                        background: `color-mix(in srgb, ${c} 8%, transparent)`,
                        maxWidth: 230,
                      }}
                    >
                      <span className="block truncate text-xs font-semibold">{txt}</span>
                      <span className="mt-0.5 block truncate text-[11px]" style={{ color: c }}>
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {status === "loading" && (
          <ul className="flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 border-b py-3" style={{ borderColor: "var(--line)" }}>
                <span className="skeleton h-11 w-11 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="skeleton block h-4" style={{ width: `${55 + ((i * 7) % 35)}%` }} />
                  <span className="skeleton mt-2 block h-3" style={{ width: `${30 + ((i * 5) % 25)}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )}
        {status === "error" && (
          <p style={{ color: "var(--muted)" }}>Bağlanılamadı. Toplayıcı ve API çalışıyor mu?</p>
        )}
        {status === "idle" && shown.length === 0 && (
          <p style={{ color: "var(--muted)" }}>Eşleşen istasyon yok.</p>
        )}

        <ul className="flex flex-col">
          {shown.map((s) => {
            const isPlaying = playing === s.slug;
            const np = isPlaying && liveNP ? liveNP : s.nowPlaying;
            const c = s.accentColor || DEFAULT_ACCENT;
            const artist = np?.artist?.trim() || null;
            const title = np?.title?.trim() || null;
            const sameArtistTitle = artist && title && artist === title;
            const isFav = favs.has(s.slug);

            return (
              <li key={s.slug}>
                <div
                  className="station-row group flex w-full items-center border-b"
                  style={{
                    borderColor: "var(--line)",
                    background: isPlaying
                      ? `color-mix(in srgb, ${c} 13%, transparent)`
                      : undefined,
                    boxShadow: isPlaying ? `inset 3px 0 0 ${c}` : undefined,
                  }}
                >
                  <button
                    onClick={() => toggle(s)}
                    className="flex min-w-0 flex-1 items-center gap-4 py-3 pl-1 pr-2 text-left"
                  >
                    {/* İstasyonun renginden türeyen kapak karesi */}
                    <span
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 50%, #000))`,
                        ["--eq-color" as string]: readableOn(c),
                      }}
                    >
                      {isPlaying ? (
                        <span className="eq flex items-end gap-[2px]" aria-hidden>
                          <span /><span /><span /><span />
                        </span>
                      ) : (
                        <span
                          className="text-[15px] font-bold"
                          style={{ color: readableOn(c), opacity: 0.92 }}
                        >
                          {s.name.trim().charAt(0).toLocaleUpperCase("tr")}
                        </span>
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
                        {s.band === "int" ? `${FLAG[s.slug] || "🌍"} ` : ""}
                        <span style={{ color: c }}>{s.name}</span>
                        {s.frequency ? ` · ${s.frequency}` : ""}
                        {s.city ? ` · ${s.city}` : ""}
                        {isPlaying && phase === "connecting"
                          ? " · bağlanıyor…"
                          : np
                            ? isPlaying && liveNP
                              ? " · canlı"
                              : np.updatedAt
                                ? ` · ${since(np.updatedAt, now || Date.now())}`
                                : ""
                            : ""}
                      </span>
                    </span>
                  </button>

                  {/* Favori yıldızı — ayrı düğme (çalmayı tetiklemez) */}
                  <button
                    onClick={() => toggleFav(s.slug)}
                    aria-label={isFav ? "favoriden çıkar" : "favorilere ekle"}
                    className="shrink-0 px-2 py-4 text-lg leading-none transition-colors"
                    style={{ color: isFav ? "#ffcf4d" : "var(--muted)" }}
                  >
                    {isFav ? "★" : "☆"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Alt çalma çubuğu — çalan istasyonun renginde */}
      {current && (
        <div
          className="nowbar-float fixed inset-x-0 bottom-0 z-10 border-t"
          style={{ background: accent, borderColor: "rgba(255,255,255,0.15)" }}
        >
          <div
            className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3"
            style={{ color: readableOn(accent) }}
          >
            <button
              onClick={() => toggle(current)}
              aria-label="Durdur"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.18)", color: readableOn(accent) }}
            >
              <span className="flex gap-[3px]">
                <span className="h-4 w-[3px] rounded-sm" style={{ background: readableOn(accent) }} />
                <span className="h-4 w-[3px] rounded-sm" style={{ background: readableOn(accent) }} />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {phase === "error"
                  ? "yayına ulaşılamadı"
                  : phase === "connecting" && !barQuery
                    ? "bağlanıyor…"
                    : barNp
                      ? barNp.artist && barNp.title && barNp.artist !== barNp.title
                        ? `${barNp.artist} — ${barNp.title}`
                        : barNp.title || barNp.rawTitle
                      : tagline(current.genre, current.slug)}
              </div>
              <div className="truncate text-xs opacity-80">{current.name}</div>
            </div>

            {/* Şarkıyı Spotify / YouTube'da aç */}
            {barQuery && (
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(barQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Spotify'da ara"
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: "rgba(0,0,0,0.18)", color: readableOn(accent) }}
                >
                  Spotify
                </a>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(barQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube'da ara"
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: "rgba(0,0,0,0.18)", color: readableOn(accent) }}
                >
                  YouTube
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sadece bu satırdan ses çıkar; görünmez. Kesilirse yeniden bağlanır. */}
      <audio
        ref={audioRef}
        onWaiting={() => {
          if (playingRef.current) setPhase("connecting");
        }}
        onPlaying={() => {
          retriesRef.current = 0;
          setPhase("playing");
        }}
        onEnded={reconnect}
        onError={reconnect}
      />
    </div>
  );
}
