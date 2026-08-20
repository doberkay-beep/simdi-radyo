"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import {
  selamla,
  EPIGRAFLAR,
  DIZELER,
  YUKLENIYOR,
  TUR_EPIGRAF,
  FISILTI,
  HOSGELDIN,
  FAVORI_ONAY,
  SAIRIN,
  gununDizesi,
} from "@/lib/sozler";
import KartModal from "./KartModal";

const SAIR_SET = new Set(SAIRIN.slugs);

// Tür → renk. Bir tür seçilince (henüz bir şey çalmıyorken) arka plan o renge kayar.
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
  homepage: string | null;
  nowPlaying: NowPlaying;
};

// İstasyonun resmî sitesinden logo (favicon) — kapak olarak.
function faviconOf(homepage: string | null): string | null {
  if (!homepage) return null;
  try {
    const host = new URL(homepage).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

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
  const [favOnly, setFavOnly] = useState(false); // sadece favoriler
  const [sairMode, setSairMode] = useState(false); // Şairin Frekansı seçkisi
  const [sort, setSort] = useState<"liste" | "az" | "tur">("liste"); // sıralama
  const [volume, setVolume] = useState(1); // ses seviyesi 0..1
  const [muted, setMuted] = useState(false); // sessiz
  const [history, setHistory] = useState<string[]>([]); // son dinlenenler (slug)
  const [scrolled, setScrolled] = useState(false); // yapışkan mini başlık için
  const [epi, setEpi] = useState(0); // dönen epigraf
  const [welcomed, setWelcomed] = useState(true); // ilk giriş perdesi (true=gizli)
  const [favToast, setFavToast] = useState(""); // favori onay fısıltısı
  const [showKeys, setShowKeys] = useState(false); // kısayol kartı
  const [focus, setFocus] = useState(false); // sessizlik / odak modu
  const [odakDize, setOdakDize] = useState(0); // odakta dönen dize
  const [kartAcik, setKartAcik] = useState(false); // paylaşılabilir kart penceresi
  const [geceModu, setGeceModu] = useState(false); // ses eşitleme (Web Audio compressor)
  // Çalan istasyonun CANLI çalan bilgisi (toplayıcıdan değil, anlık yoklamadan).
  const [liveNP, setLiveNP] = useState<NowPlaying>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Web Audio grafiği — SADECE gece modu ilk açıldığında kurulur (opt-in, güvenli).
  const audioCtxRef = useRef<AudioContext | null>(null);
  const compRef = useRef<DynamicsCompressorNode | null>(null);
  const srcNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
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
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
        setFavToast(FAVORI_ONAY);
        setTimeout(() => setFavToast(""), 1800);
      }
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {
        // yok say
      }
      return next;
    });
  }

  // Ses + geçmiş tercihlerini yükle.
  useEffect(() => {
    try {
      const v = localStorage.getItem("ses");
      if (v != null) setVolume(Math.min(1, Math.max(0, Number(v))));
      const m = localStorage.getItem("sessiz");
      if (m === "1") setMuted(true);
      const h = localStorage.getItem("gecmis");
      if (h) setHistory(JSON.parse(h));
    } catch {
      // yok say
    }
  }, []);

  // Ses seviyesini uygula + kaydet.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
    try {
      localStorage.setItem("ses", String(volume));
      localStorage.setItem("sessiz", muted ? "1" : "0");
    } catch {
      // yok say
    }
  }, [volume, muted]);

  // Kaydırınca yapışkan mini başlık.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 220);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Epigraf yavaşça dönsün + ilk giriş perdesini bir kez göster.
  useEffect(() => {
    setEpi(Math.floor(Date.now() / 12000) % EPIGRAFLAR.length);
    const id = setInterval(() => setEpi((e) => (e + 1) % EPIGRAFLAR.length), 12000);
    try {
      if (!localStorage.getItem("karsilandi")) setWelcomed(false);
    } catch {
      // yok say
    }
    return () => clearInterval(id);
  }, []);

  function dismissWelcome() {
    setWelcomed(true);
    try {
      localStorage.setItem("karsilandi", "1");
    } catch {
      // yok say
    }
  }

  // Odak modunda dize yavaşça dönsün; çalma durursa moddan çık.
  useEffect(() => {
    if (!focus) return;
    if (!playing) {
      setFocus(false);
      return;
    }
    setOdakDize(Math.floor(Date.now() / 11000) % DIZELER.length);
    const id = setInterval(() => setOdakDize((d) => (d + 1) % DIZELER.length), 11000);
    return () => clearInterval(id);
  }, [focus, playing]);

  function pushHistory(slug: string) {
    setHistory((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 12);
      try {
        localStorage.setItem("gecmis", JSON.stringify(next));
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

  // Türleri say, çoktan aza sırala ([tür, adet] — çiplerde sayı göster).
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of stations) {
      if (s.genre) counts.set(s.genre, (counts.get(s.genre) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [stations]);

  // Ülke + tür + arama + favori süz, sonra sırala.
  const shown = useMemo(() => {
    // Şairin Frekansı: seçkiyi kendi sırasında göster (diğer filtreleri yok say).
    if (sairMode) {
      const byslug = new Map(stations.map((s) => [s.slug, s]));
      return SAIRIN.slugs.map((sl) => byslug.get(sl)).filter((s): s is Station => !!s);
    }
    const q = low(query.trim());
    let list = stations;
    if (region !== "all") {
      list = list.filter((s) => (region === "int" ? s.band === "int" : s.band !== "int"));
    }
    if (genre) list = list.filter((s) => s.genre === genre);
    if (favOnly) list = list.filter((s) => favs.has(s.slug));
    if (q) {
      list = list.filter((s) =>
        [s.name, s.city, s.frequency, s.genre].some((v) => v && low(v).includes(q)),
      );
    }
    const out = [...list];
    if (sort === "az") {
      out.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    } else if (sort === "tur") {
      out.sort(
        (a, b) =>
          (a.genre || "zzz").localeCompare(b.genre || "zzz", "tr") ||
          a.name.localeCompare(b.name, "tr"),
      );
    } else {
      // liste sırası: favoriler en üstte
      out.sort((a, b) => Number(favs.has(b.slug)) - Number(favs.has(a.slug)));
    }
    return out;
  }, [stations, region, genre, query, favs, favOnly, sort, sairMode]);

  // Türe göre gruplama sadece "tür" sıralamasında, filtre/arama yokken.
  const grouped = sort === "tur" && !genre && !favOnly && !query.trim() && !sairMode;

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

  // Gece modu: sesi eşitle (yüksek/alçak farkını yumuşat). Web Audio grafiği
  // yalnızca burada, kullanıcı ilk kez açınca kurulur — normal dinleyici bu
  // yola hiç girmez, o yüzden olağan oynatma etkilenmez.
  function geceModuAc(ac: boolean) {
    const a = audioRef.current;
    if (!a) return;
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) throw new Error("Web Audio yok");
        const ctx = new Ctx();
        const src = ctx.createMediaElementSource(a); // eleman başına bir kez
        const comp = ctx.createDynamicsCompressor();
        src.connect(comp);
        comp.connect(ctx.destination);
        audioCtxRef.current = ctx;
        srcNodeRef.current = src;
        compRef.current = comp;
      }
      audioCtxRef.current.resume?.();
      const c = compRef.current!;
      const t = audioCtxRef.current.currentTime;
      if (ac) {
        // Eşitle: alçak sesleri kaldır, yüksekleri bastır.
        c.threshold.setValueAtTime(-30, t);
        c.knee.setValueAtTime(24, t);
        c.ratio.setValueAtTime(6, t);
        c.attack.setValueAtTime(0.004, t);
        c.release.setValueAtTime(0.25, t);
      } else {
        // Şeffaf: grafik bağlı kalır ama etki yok.
        c.threshold.setValueAtTime(0, t);
        c.knee.setValueAtTime(0, t);
        c.ratio.setValueAtTime(1, t);
      }
      setGeceModu(ac);
    } catch {
      // Web Audio kurulamadıysa sessizce vazgeç; oynatma olağan sürer.
      setGeceModu(false);
    }
  }

  // Klavye kısayolları: boşluk = çal/dur, "/" = arama, Esc = arama kapat.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (e.key === "Escape") el?.blur();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setShowKeys((v) => !v);
      } else if (e.key === "f" || e.key === "F") {
        if (current) setFocus((v) => !v);
      } else if (e.key === "k" || e.key === "K") {
        if (current) setKartAcik((v) => !v);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMuted(false);
        setVolume((v) => Math.min(1, Math.round((v + 0.05) * 100) / 100));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setVolume((v) => Math.max(0, Math.round((v - 0.05) * 100) / 100));
      } else if (e.key === "Escape") {
        setShowKeys(false);
        setFocus(false);
        setKartAcik(false);
      } else if (e.code === "Space") {
        e.preventDefault();
        if (current) toggle(current);
        else if (featured) toggle(featured);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, featured]);

  // "Şu an çalanlar" şeridi — gerçekten parça bilgisi olan istasyonlar.
  const nowStrip = useMemo(
    () => stations.filter((s) => s.nowPlaying && (s.nowPlaying.title || s.nowPlaying.artist)).slice(0, 14),
    [stations],
  );

  // Saat (Türkiye saati = kullanıcının cihaz saati). now ile ~20 sn'de tazelenir.
  const clockD = new Date(now || Date.now());
  const clock = `${pad2(clockD.getHours())}:${pad2(clockD.getMinutes())}`;
  const selam = selamla(clockD.getHours());

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

  // Sekme başlığı çalanı göstersin + favicon çalarken renklensin.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const base = "ŞİMDİ — radyoda şu an ne çalıyor";
    const np = current ? liveNP ?? current.nowPlaying : null;
    if (current && np) {
      const t =
        np.artist && np.title && np.artist !== np.title
          ? `${np.artist} — ${np.title}`
          : np.title || np.rawTitle || current.name;
      document.title = `♪ ${t} · ŞİMDİ`;
    } else if (current) {
      document.title = `♪ ${current.name} · ŞİMDİ`;
    } else {
      document.title = base;
    }
    // Favicon: çalarken istasyon renginde küçük bir ekolayzer çiz.
    try {
      const link =
        (document.querySelector('link[rel="icon"]') as HTMLLinkElement) ||
        Object.assign(document.createElement("link"), { rel: "icon" });
      if (!link.parentNode) document.head.appendChild(link);
      if (current) {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 64;
        const ctx = cv.getContext("2d");
        if (ctx) {
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.roundRect(0, 0, 64, 64, 14);
          ctx.fill();
          ctx.fillStyle = readableOn(accent);
          const hs = [26, 44, 34];
          [14, 28, 42].forEach((x, i) => {
            const h = hs[i];
            ctx.beginPath();
            ctx.roundRect(x, 56 - h, 8, h, 4);
            ctx.fill();
          });
          link.href = cv.toDataURL("image/png");
        }
      } else {
        link.href = "/icon.png";
      }
    } catch {
      // yok say
    }
  }, [current, liveNP, accent]);

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
    pushHistory(s.slug);
    audio.src = `/api/stream/${s.slug}`;
    audio.volume = muted ? 0 : volume;
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
      className={`spread min-h-screen ${playing ? "" : genre ? "" : "aurora"}`}
      style={
        playing
          ? { ["--accent" as string]: accent }
          : genre && TUR_RENK[genre]
            ? { ["--accent" as string]: TUR_RENK[genre] }
            : undefined
      }
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

      {/* Çalarken sayfanın çok yavaş nefes alması */}
      {playing && <div className="breathe" aria-hidden />}

      {/* Kaydırınca beliren yapışkan mini başlık */}
      <div
        className="fixed inset-x-0 top-0 z-20 border-b backdrop-blur transition-transform duration-300"
        style={{
          background: "color-mix(in srgb, var(--bg) 82%, transparent)",
          borderColor: "var(--line)",
          transform: scrolled ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-2.5">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="brand text-lg font-bold tracking-tight"
            aria-label="başa dön"
          >
            ŞİMDİ
          </button>
          {current && (
            <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--muted)" }}>
              <span style={{ color: accent }}>▶</span>{" "}
              {(() => {
                const np = liveNP ?? current.nowPlaying;
                return np
                  ? np.artist && np.title && np.artist !== np.title
                    ? `${np.artist} — ${np.title}`
                    : np.title || np.rawTitle || current.name
                  : current.name;
              })()}
            </span>
          )}
        </div>
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
              <Link href="/kesif" className="underline" style={{ color: "var(--muted)" }}>
                keşif
              </Link>
              <Link href="/kose" className="underline" style={{ color: "var(--muted)" }}>
                köşe
              </Link>
              <Link href="/nabiz" className="underline" style={{ color: "var(--muted)" }}>
                nabız
              </Link>
              <Link href="/arsiv" className="underline" style={{ color: "var(--muted)" }}>
                arşiv →
              </Link>
            </span>
          </div>
        </header>

        {/* Selamlama (edebi) + saat + sayaçlar */}
        {now > 0 && (
          <div className="mb-5">
            <p className="epigraf text-[15px]">{selam}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {clock} · {stations.length} radyo · {genres.length} tür
            </p>
          </div>
        )}

        {/* Günün epigrafı — boştayken yavaşça döner */}
        {!playing && now > 0 && (
          <p className="epigraf fade-in mb-5 text-lg" key={epi}>
            — {EPIGRAFLAR[epi]}
          </p>
        )}

        {/* Arama */}
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İstasyon ara…  (/ ile hızlı ara, boşluk çal/dur)"
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

        {/* Favori filtresi + sıralama + Şairin Frekansı */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={() => setSairMode((v) => !v)}
            className="rounded-full border px-3 py-1 transition-colors"
            style={{
              borderColor: sairMode ? "var(--accent)" : "var(--line)",
              color: sairMode ? "var(--fg)" : "var(--muted)",
              background: sairMode ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
            }}
          >
            ✍ şairin frekansı
          </button>
          <button
            onClick={() => setFavOnly((v) => !v)}
            className="rounded-full border px-3 py-1 transition-colors"
            style={{
              borderColor: favOnly ? "#ffcf4d" : "var(--line)",
              color: favOnly ? "#ffcf4d" : "var(--muted)",
            }}
          >
            {favOnly ? "★ favoriler" : "☆ favoriler"}
          </button>
          <button
            onClick={() => setSort((s) => (s === "liste" ? "az" : s === "az" ? "tur" : "liste"))}
            className="rounded-full border px-3 py-1 transition-colors"
            style={{ borderColor: "var(--line)", color: "var(--muted)" }}
          >
            sıra: {sort === "liste" ? "öne çıkan" : sort === "az" ? "A-Z" : "tür"}
          </button>
        </div>

        {/* Tür filtresi çipleri (sayılı) */}
        {genres.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setGenre(null)}
              className="rounded-full border px-3 py-1 text-xs transition-colors"
              style={{
                borderColor: genre === null ? "var(--fg)" : "var(--line)",
                background: genre === null ? "var(--fg)" : "transparent",
                color: genre === null ? "var(--bg)" : "var(--muted)",
              }}
            >
              tümü
            </button>
            {genres.map(([g, n]) => {
              const active = genre === g;
              return (
                <button
                  key={g}
                  onClick={() => setGenre(active ? null : g)}
                  className="rounded-full border px-3 py-1 text-xs transition-colors"
                  style={{
                    borderColor: active ? "var(--fg)" : "var(--line)",
                    background: active ? "var(--fg)" : "transparent",
                    color: active ? "var(--bg)" : "var(--muted)",
                  }}
                >
                  {g} <span style={{ opacity: 0.6 }}>{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Şairin Frekansı — girişte edebi tanıtım */}
        {sairMode && (
          <div className="fade-in mb-6">
            <h2 className="brand text-2xl font-bold">✍ {SAIRIN.baslik}</h2>
            <p className="epigraf mt-1 text-base">{SAIRIN.alt}</p>
          </div>
        )}

        {/* Türe girince edebi epigraf */}
        {!sairMode && genre && TUR_EPIGRAF[genre] && (
          <p className="epigraf fade-in mb-5 text-base" key={genre}>
            {TUR_EPIGRAF[genre]}
          </p>
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

        {/* "Son dinlediklerin" yatay şerit */}
        {!playing && (() => {
          const items = history
            .map((slug) => stations.find((s) => s.slug === slug))
            .filter((s): s is Station => !!s)
            .slice(0, 12);
          if (!items.length) return null;
          return (
            <div className="mb-6">
              <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                son dinlediklerin
              </p>
              <div className="no-scrollbar -mx-5 overflow-x-auto px-5">
                <div className="flex gap-2 pb-1">
                  {items.map((s) => {
                    const c = s.accentColor || DEFAULT_ACCENT;
                    return (
                      <button
                        key={s.slug}
                        onClick={() => toggle(s)}
                        className="press flex shrink-0 items-center gap-2 rounded-xl border py-2 pl-2 pr-3"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 50%, #000))`,
                            color: readableOn(c),
                          }}
                        >
                          {s.name.trim().charAt(0).toLocaleUpperCase("tr")}
                        </span>
                        <span className="text-xs font-medium">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {status === "loading" && (
          <>
          <p className="epigraf mb-3 text-sm">{YUKLENIYOR[epi % YUKLENIYOR.length]}</p>
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
          </>
        )}
        {status === "error" && (
          <p style={{ color: "var(--muted)" }}>Bağlanılamadı. Toplayıcı ve API çalışıyor mu?</p>
        )}
        {status === "idle" && shown.length === 0 && (
          <div style={{ color: "var(--muted)" }}>
            <p>Eşleşen istasyon yok.</p>
            {(query || genre || favOnly || region !== "all") && (
              <button
                onClick={() => {
                  setQuery("");
                  setGenre(null);
                  setFavOnly(false);
                  setRegion("all");
                }}
                className="mt-2 underline"
                style={{ color: "var(--fg)" }}
              >
                filtreleri temizle
              </button>
            )}
          </div>
        )}

        <ul className="flex flex-col">
          {shown.map((s, i) => {
            const isPlaying = playing === s.slug;
            const np = isPlaying && liveNP ? liveNP : s.nowPlaying;
            const c = s.accentColor || DEFAULT_ACCENT;
            const artist = np?.artist?.trim() || null;
            const title = np?.title?.trim() || null;
            const sameArtistTitle = artist && title && artist === title;
            const isFav = favs.has(s.slug);
            const showHeader = grouped && shown[i - 1]?.genre !== s.genre;

            return (
              <li key={s.slug}>
                {showHeader && (
                  <div
                    className="mb-1 mt-4 px-1 text-xs uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    {s.genre || "diğer"}
                  </div>
                )}
                <div
                  className="station-row row-in group flex w-full items-center border-b"
                  style={{
                    borderColor: "var(--line)",
                    background: isPlaying
                      ? `color-mix(in srgb, ${c} 13%, transparent)`
                      : undefined,
                    boxShadow: isPlaying ? `inset 3px 0 0 ${c}` : undefined,
                    animationDelay: `${Math.min(i, 18) * 22}ms`,
                  }}
                >
                  <button
                    onClick={() => toggle(s)}
                    className="press flex min-w-0 flex-1 items-center gap-4 py-3 pl-1 pr-2 text-left"
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
                        <>
                          <span
                            className="text-[15px] font-bold"
                            style={{ color: readableOn(c), opacity: 0.92 }}
                          >
                            {s.name.trim().charAt(0).toLocaleUpperCase("tr")}
                          </span>
                          {faviconOf(s.homepage) && (
                            <img
                              src={faviconOf(s.homepage)!}
                              alt=""
                              loading="lazy"
                              className="absolute inset-0 m-auto h-7 w-7 rounded-md object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </>
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
                        {SAIR_SET.has(s.slug) ? <span title="şairin frekansı">✍ </span> : ""}
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

                  {/* İstasyon sayfası (SEO/paylaş) — fareyle belirir */}
                  <Link
                    href={`/radyo/${s.slug}`}
                    aria-label={`${s.name} sayfası`}
                    className="shrink-0 px-1 py-4 text-sm leading-none opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: "var(--muted)" }}
                  >
                    ↗
                  </Link>
                  {/* Favori yıldızı — ayrı düğme (çalmayı tetiklemez) */}
                  <button
                    onClick={() => toggleFav(s.slug)}
                    aria-label={isFav ? "favoriden çıkar" : "favorilere ekle"}
                    className="press shrink-0 px-2 py-4 text-lg leading-none transition-colors"
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
            style={{
              color: readableOn(accent),
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
            }}
          >
            <button
              onClick={() => toggle(current)}
              aria-label="Durdur"
              className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.18)", color: readableOn(accent) }}
            >
              <span className="flex gap-[3px]">
                <span className="h-4 w-[3px] rounded-sm" style={{ background: readableOn(accent) }} />
                <span className="h-4 w-[3px] rounded-sm" style={{ background: readableOn(accent) }} />
              </span>
            </button>
            {/* Canlı dalga (çalarken) */}
            {phase === "playing" && (
              <span
                className="eq hidden items-end gap-[2px] sm:flex"
                style={{ ["--eq-color" as string]: readableOn(accent) }}
                aria-hidden
              >
                <span /><span /><span /><span /><span />
              </span>
            )}
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

            {/* Paylaşılabilir kart */}
            <button
              onClick={() => setKartAcik(true)}
              aria-label="kartı paylaş"
              title="şu an çalanı kart olarak paylaş (k)"
              className="press hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex"
              style={{ background: "rgba(0,0,0,0.18)", color: readableOn(accent) }}
            >
              kart
            </button>

            {/* Sessizlik / odak modu */}
            <button
              onClick={() => setFocus(true)}
              aria-label="sessizlik modu"
              title="sessizlik modu (f)"
              className="press shrink-0 text-lg leading-none"
              style={{ color: readableOn(accent) }}
            >
              ◐
            </button>

            {/* Ses seviyesi + sessize alma (geniş ekranda) */}
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <button
                onClick={() => geceModuAc(!geceModu)}
                aria-label="gece modu — sesi eşitle"
                title="gece modu: sesi eşitle (yüksek/alçak farkını yumuşat)"
                className="press rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  background: geceModu ? readableOn(accent) : "rgba(0,0,0,0.18)",
                  color: geceModu ? accent : readableOn(accent),
                }}
              >
                eşitle
              </button>
              <button
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "sesi aç" : "sessize al"}
                className="press text-base leading-none"
                style={{ color: readableOn(accent) }}
              >
                {muted || volume === 0 ? "🔇" : "🔊"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setMuted(false);
                }}
                aria-label="ses seviyesi"
                className="h-1 w-20 cursor-pointer accent-current"
                style={{ color: readableOn(accent) }}
              />
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

      {/* Sessizlik / Odak Modu — tam ekran, tek istasyon, bir dize */}
      {focus && current && (
        <div
          className="fade-in fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
          style={{
            background: `radial-gradient(60% 50% at 50% 45%, color-mix(in srgb, ${accent} 12%, #08080a), #08080a 75%)`,
          }}
        >
          <button
            onClick={() => setFocus(false)}
            aria-label="çık"
            className="press absolute right-6 top-6 text-2xl"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>

          {/* Büyük saat — sessiz bir ekran koruyucu hissi */}
          <div
            className="brand mb-6 text-6xl font-bold tabular-nums sm:text-7xl"
            style={{ color: "#ececee", letterSpacing: "-0.02em" }}
          >
            {clock}
          </div>

          <span
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: accent }}
          >
            {current.name}
          </span>

          <div className="read mt-6 max-w-xl text-3xl leading-snug" style={{ color: "#ececee" }}>
            {(() => {
              const np = liveNP ?? current.nowPlaying;
              if (!np) return tagline(current.genre, current.slug);
              return np.artist && np.title && np.artist !== np.title
                ? `${np.artist} — ${np.title}`
                : np.title || np.rawTitle;
            })()}
          </div>

          <div className="mx-auto my-8 h-px w-16" style={{ background: accent, opacity: 0.5 }} />

          <p className="read fade-in max-w-lg text-xl italic" key={odakDize} style={{ color: "#9a9aa2" }}>
            {DIZELER[odakDize]}
          </p>

          <div className="absolute bottom-10 flex items-center gap-6">
            <button
              onClick={() => toggle(current)}
              aria-label="duraklat"
              className="press text-sm"
              style={{ color: "var(--muted)" }}
            >
              {phase === "connecting" ? "bağlanıyor…" : "❚❚ duraklat"}
            </button>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              çıkmak için Esc
            </span>
          </div>
        </div>
      )}

      {/* Favori onayı — kısa edebi fısıltı */}
      {favToast && (
        <div
          className="fade-in fixed left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-sm"
          style={{
            bottom: current ? 92 : 28,
            background: "var(--fg)",
            color: "var(--bg)",
          }}
        >
          {favToast}
        </div>
      )}

      {/* Kısayol kartı ( ? ile açılır ) */}
      {showKeys && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-6"
          style={{ background: "color-mix(in srgb, var(--bg) 70%, transparent)" }}
          onClick={() => setShowKeys(false)}
        >
          <div
            className="fade-in w-full max-w-sm rounded-2xl border p-6"
            style={{ background: "var(--bg)", borderColor: "var(--line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="brand mb-4 text-xl font-bold">kısayollar</h2>
            <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--fg)" }}>
              {[
                ["boşluk", "çal / dur"],
                ["/", "aramaya git"],
                ["↑ ↓", "ses aç / kıs"],
                ["f", "sessizlik modu"],
                ["k", "kartı paylaş"],
                ["?", "bu kartı aç/kapat"],
                ["Esc", "kapat"],
              ].map(([k, d]) => (
                <li key={k} className="flex items-center justify-between">
                  <span style={{ color: "var(--muted)" }}>{d}</span>
                  <kbd
                    className="rounded-md border px-2 py-0.5 text-xs"
                    style={{ borderColor: "var(--line)" }}
                  >
                    {k}
                  </kbd>
                </li>
              ))}
            </ul>
            <p className="epigraf mt-5 text-sm">{gununDizesi()}</p>
          </div>
        </div>
      )}

      {/* Paylaşılabilir kart penceresi */}
      {kartAcik && current && (
        <KartModal
          slug={current.slug}
          name={current.name}
          accent={accent}
          onClose={() => setKartAcik(false)}
        />
      )}

      {/* İlk giriş perdesi — bir kez */}
      {!welcomed && (
        <div
          className="fade-in fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
          style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
          onClick={dismissWelcome}
        >
          <span className="brand text-5xl font-bold tracking-tight">ŞİMDİ</span>
          <h2 className="read mt-6 text-2xl italic" style={{ color: "var(--fg)" }}>
            {HOSGELDIN.baslik}
          </h2>
          <p className="read mt-2 max-w-md text-lg italic" style={{ color: "var(--muted)" }}>
            {HOSGELDIN.satir}
          </p>
          <button
            onClick={dismissWelcome}
            className="press mt-8 rounded-full px-6 py-2.5 text-sm font-semibold"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            başla
          </button>
          {/* uzun sessizlikte fısıltı — ilk perde metniyle aynı ruh */}
          <span className="sr-only">{FISILTI}</span>
        </div>
      )}
    </div>
  );
}
