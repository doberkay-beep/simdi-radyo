"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import ToneToggle from "./ToneToggle";
import KonsolRaylar from "./KonsolRaylar";
import { kaynagiCalistir, hlsYik } from "@/lib/cal";
import { dinleyiciKatil, simdiDinle, type CanliKanal } from "@/lib/canli";
import { temizMetin } from "@/lib/cop";
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
import MuzikKarti, { KapakMini } from "./MuzikKarti";
import Ikon from "./Ikon";
import Notlar from "./Notlar";
import FrekansKarti from "./FrekansKarti";
import DilToggle from "./DilToggle";
import Kadran from "./Kadran";
import DunyadaSimdi from "./DunyadaSimdi";
import DefterSeridi from "./DefterSeridi";
import GeceNobeti from "./GeceNobeti";
import AvDefteri from "./AvDefteri";
import KurSihirbazi, { kuruluMu } from "./KurSihirbazi";
import SanatciTakip from "./SanatciTakip";
import KasaModal from "./KasaModal";
import YukariCik from "./YukariCik";
import SenkronBandi from "./SenkronBandi";
import SurusModu from "./SurusModu";
import SiirKosesi from "./SiirKosesi";
import { KASA_OLAYI } from "@/lib/kasa";
import SanatciRadari from "./SanatciRadari";
import SairinFrekansi from "./SairinFrekansi";
import { avEkle, izlenenOku } from "@/lib/avlar";
import { dinlemeKaydet } from "@/lib/wrapped";
import { odaBaglan, odaKoduUret, type Oda } from "@/lib/oda";
import { istasyonUlkesi, bayrakEmoji, doluUlkeler, ulkeSlug, ULKELER } from "@/lib/ulkeler";
import { useDil, turAdi } from "@/lib/i18n";

const SAIR_SET = new Set(SAIRIN.slugs);

// Tür → renk. Bir tür seçilince (henüz bir şey çalmıyorken) arka plan o renge kayar.
const TUR_RENK: Record<string, string> = {
  haber: "#4a6fa5",
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
  id: number;
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

// "az önce", "3 dk önce" gibi göreli zaman. now_playing.updated_at parçanın
// SON DEĞİŞTİĞİ an olduğu için, saatlerce değişmeyen (uzun parça/aynı yayın)
// istasyonlarda "8 saat önce" yanıltır — o yüzden yalnızca yeni değişimleri
// (< 45 dk) göster; eskiyse boş dön (parça yine güncel kabul edilir).
function since(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 45) return `${m} dk önce`;
  return "";
}

const DEFAULT_ACCENT = "#6b7280";
const FAV_KEY = "favoriler";

// Kilit ekranı kapağı: istasyon renginde degrade + baş harf + ŞİMDİ imzası.
// Canvas bir kez çizilir, data URL slug başına önbellekte tutulur.
const kapakOnbellek = new Map<string, string>();
function kapakUret(slug: string, name: string, accent: string): string {
  const varOlan = kapakOnbellek.get(slug);
  if (varOlan) return varOlan;
  try {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");
    if (!ctx) return "/icon.png";
    const g = ctx.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, accent);
    g.addColorStop(1, "#0a0a0b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = readableOn(accent);
    ctx.font = "bold 260px 'Instrument Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.trim().charAt(0).toLocaleUpperCase("tr"), 256, 268);
    ctx.globalAlpha = 0.85;
    ctx.font = "600 40px 'Instrument Sans', system-ui, sans-serif";
    ctx.fillText("ŞİMDİ", 256, 452);
    const url = c.toDataURL("image/png");
    kapakOnbellek.set(slug, url);
    return url;
  } catch {
    return "/icon.png";
  }
}

// Yabancı istasyonların bayrağı (slug'a göre). Yeni yabancı eklenince buraya da eklenir.

const pad2 = (n: number) => String(n).padStart(2, "0");

// Şarkı bilgisi vermeyen istasyonlar için türe uygun "havalı" cümleler.
const TAGLINES: Record<string, string[]> = {
  haber: ["gündem canlı akıyor", "dünyadan sesler", "haber, olduğu an"],
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
  const { t, dil } = useDil();
  const [stations, setStations] = useState<Station[]>([]);
  // Realtime'dan az önce parça değişimi düşen istasyonlar — kart 4 sn parlar.
  const [tazeler, setTazeler] = useState<Record<number, number>>({});
  const [playing, setPlaying] = useState<string | null>(null);
  const [ulke, setUlke] = useState<string | null>(null); // kadran ülke bandı
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
  const [filtrelerAcik, setFiltrelerAcik] = useState(false); // ikincil filtreler katlanır
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
  const [defterAcik, setDefterAcik] = useState(false); // kalp defteri alt paneli
  const [frekansAcik, setFrekansAcik] = useState(false); // frekans kartı (kişisel karne)
  const [frekansKip, setFrekansKip] = useState<"hep" | "ay">("hep"); // wrapped bandından açılırsa "ay"
  const [avAcik, setAvAcik] = useState(false); // müzik defteri (şarkı yakala)
  const [notAcik, setNotAcik] = useState(false); // kalp defteri — not bırakma modalı
  const [muzikKart, setMuzikKart] = useState<{ artist: string; title: string | null } | null>(null); // ♪ müzik kartı
  const [navAcik, setNavAcik] = useState(false); // mobil ☰ menü sayfası
  const [cipMenu, setCipMenu] = useState(false); // mobil oynatıcı ⋯ menüsü
  const [kurAcik, setKurAcik] = useState(false); // 📲 uygulama kur sihirbazı
  const [takipAcik, setTakipAcik] = useState(false); // 🔔 sanatçı ara + takip
  const [kasaAcik, setKasaAcik] = useState(false); // 🔐 hafıza kodu
  const [siirAcik, setSiirAcik] = useState(false); // 📖 şiir köşesi (Şiir Rafım Radyosu)
  const [surus, setSurus] = useState(false); // 🚗 sürüş modu
  const [turHepsi, setTurHepsi] = useState(false); // tür çiplerinin hepsi açık mı
  const [takipSay, setTakipSay] = useState(0); // takip edilen sanatçı sayısı (hap parlasın)
  useEffect(() => {
    if (takipAcik) return;
    const say = () => setTakipSay(izlenenOku().length);
    say();
    window.addEventListener(KASA_OLAYI, say);
    return () => window.removeEventListener(KASA_OLAYI, say);
  }, [takipAcik]);
  const [darEkran, setDarEkran] = useState(false); // arama yer tutucusunun kısa hali için

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const uygula = () => setDarEkran(mq.matches);
    uygula();
    mq.addEventListener("change", uygula);
    return () => mq.removeEventListener("change", uygula);
  }, []);
  const [avGeri, setAvGeri] = useState(0); // "yakalandı" geri bildirimi (zaman damgası)
  // Radyoyla uyan — {ts, slug}: sekme açıkken saati gelince o istasyonu çal.
  const [alarm, setAlarm] = useState<{ ts: number; slug: string } | null>(null);
  const [alarmAcik, setAlarmAcik] = useState(false);
  const [alarmSaat, setAlarmSaat] = useState("07:30");
  const [alarmRastgele, setAlarmRastgele] = useState(false);
  // Birlikte dinle — ortak dinleme odası.
  const [oda, setOda] = useState<{ kod: string; rol: "host" | "uye" } | null>(null);
  const [odaSayi, setOdaSayi] = useState(1);
  const [odaDavet, setOdaDavet] = useState<string | null>(null);
  const [odaBilgi, setOdaBilgi] = useState<string | null>(null);
  const odaRef = useRef<Oda | null>(null);
  const [pwaIpucu, setPwaIpucu] = useState(false); // iOS "ana ekrana ekle" ipucu (bir kez)
  const jestRef = useRef<{ x: number; y: number } | null>(null); // çubukta kaydırma jesti
  const [dinleyiciSayi, setDinleyiciSayi] = useState(0); // aynı istasyonda şu an kaç kişi
  const [ucanKalpler, setUcanKalpler] = useState<{ id: number; x: number; ch?: string }[]>([]);
  const kanalRef = useRef<CanliKanal | null>(null);
  const kalpIdRef = useRef(0);

  // Kalp/tepki uçuşu — hem seninkiler hem aynı frekanstakilerinkiler süzülür.
  function kalpUcur(ch?: string) {
    const id = ++kalpIdRef.current;
    setUcanKalpler((k) => [...k.slice(-14), { id, x: 12 + Math.random() * 76, ch }]);
    setTimeout(() => setUcanKalpler((k) => k.filter((u) => u.id !== id)), 2600);
  }

  // Çalan istasyonun canlı kanalına katıl: varlık sayısı + kalp yağmuru.
  useEffect(() => {
    kanalRef.current?.ayril();
    kanalRef.current = null;
    setDinleyiciSayi(0);
    if (!playing) return;
    const kanal = dinleyiciKatil(playing, {
      sayi: setDinleyiciSayi,
      kalp: () => kalpUcur(),
    });
    kanalRef.current = kanal;
    return () => {
      kanal.ayril();
      if (kanalRef.current === kanal) kanalRef.current = null;
    };
  }, [playing]);

  useEffect(() => {
    try {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        (navigator as unknown as { standalone?: boolean }).standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches;
      if (ios && !standalone && !localStorage.getItem("pwa-ipucu")) setPwaIpucu(true);
    } catch {
      // yoksay
    }
  }, []);
  const [geceModu, setGeceModu] = useState(false); // ses eşitleme (Web Audio compressor)
  const [kalpler, setKalpler] = useState<Record<string, number>>({}); // istasyon kalp toplamları
  const [yolculuk, setYolculuk] = useState(false); // sesli yolculuk — otomatik zaping
  const kalpBekleRef = useRef<Record<string, number>>({}); // spam'e karşı kısa bekleme
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

  // Favorileri yükle (localStorage) — kasa başka cihazdan geri yüklenince de tazele.
  useEffect(() => {
    const yukle = () => {
      try {
        const raw = localStorage.getItem(FAV_KEY);
        if (raw) setFavs(new Set(JSON.parse(raw)));
      } catch {
        // yok say
      }
    };
    yukle();
    window.addEventListener(KASA_OLAYI, yukle);
    return () => window.removeEventListener(KASA_OLAYI, yukle);
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
    // Frekans Kartı için zaman damgalı günlük (yalnız bu tarayıcıda, son 400 kayıt).
    try {
      const g = JSON.parse(localStorage.getItem("dinlemeGunlugu") || "[]") as { s: string; t: number }[];
      g.push({ s: slug, t: Date.now() });
      localStorage.setItem("dinlemeGunlugu", JSON.stringify(g.slice(-400)));
    } catch {
      // yok say
    }
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
      kaynagiCalistir(audio, slug).catch(() => {});
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
    // Şarkı değişimleri Realtime'dan anında düşer; yoklama bağlıyken seyrek
    // yedek (60 sn), bağlantı yoksa eski sıklıkta (15 sn) çalışır.
    let bagli = false;
    const dataTimer = setInterval(() => {
      if (!bagli || Date.now() % 60000 < 15000) load();
    }, 15000);
    const ayril = simdiDinle(
      (d) => {
        // "Şarkı değişti" vurgusu: karta kısa parlaması için işaretle.
        setTazeler((t) => ({ ...t, [d.station_id]: Date.now() }));
        setTimeout(() => {
          setTazeler((t) => {
            const y = { ...t };
            delete y[d.station_id];
            return y;
          });
        }, 4200);
        setStations((prev) =>
          prev.map((s) =>
            s.id === d.station_id
              ? {
                  ...s,
                  nowPlaying: {
                    artist: temizMetin(d.artist),
                    title: temizMetin(d.title),
                    rawTitle: temizMetin(d.raw_title),
                    updatedAt: d.updated_at,
                  },
                }
              : s,
          ),
        );
      },
      (b) => {
        bagli = b;
      },
    );
    const clockTimer = setInterval(() => setNow(Date.now()), 20000);
    return () => {
      clearInterval(dataTimer);
      clearInterval(clockTimer);
      ayril();
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
    if (ulke) list = list.filter((s) => istasyonUlkesi(s.slug) === ulke);
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
  }, [stations, region, genre, query, favs, favOnly, sort, sairMode, ulke]);

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

  // Sesli yolculuk — açıkken her 30 sn'de başka bir istasyona ışınlan.
  useEffect(() => {
    if (!yolculuk || stations.length < 2) return;
    const hop = () => {
      const pool = stations.filter((s) => s.slug !== playingRef.current);
      if (!pool.length) return;
      toggle(pool[Math.floor(Math.random() * pool.length)]);
    };
    hop();
    const id = setInterval(hop, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yolculuk, stations]);

  // Kalp toplamlarını getir (açılışta + arada bir).
  useEffect(() => {
    let off = false;
    const load = () =>
      fetch("/api/kalp", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !off && d.kalpler && setKalpler(d.kalpler))
        .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => {
      off = true;
      clearInterval(id);
    };
  }, []);

  // Bir istasyona kalp gönder — iyimser artır, kısa bekleme ile spam'i kes.
  function kalpAt(slug: string) {
    const t = Date.now();
    if (kalpBekleRef.current[slug] && t - kalpBekleRef.current[slug] < 1200) return;
    kalpBekleRef.current[slug] = t;
    titret(18);
    if (slug === playingRef.current) {
      kanalRef.current?.kalpYolla();
      kalpUcur();
    }
    setKalpler((k) => ({ ...k, [slug]: (k[slug] || 0) + 1 }));
    fetch("/api/kalp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.toplam === "number") setKalpler((k) => ({ ...k, [slug]: d.toplam }));
      })
      .catch(() => {});
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

  // --- Radyoyla uyan ---
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("alarm") || "null");
      if (a && typeof a.ts === "number" && a.ts > Date.now()) setAlarm(a);
    } catch { /* yoksay */ }
    try {
      const kod = new URLSearchParams(window.location.search).get("oda");
      if (kod && /^[a-z0-9]{4,10}$/.test(kod)) setOdaDavet(kod);
    } catch { /* yoksay */ }
  }, []);

  function alarmKur() {
    const [sa, dk] = alarmSaat.split(":").map(Number);
    if (Number.isNaN(sa) || Number.isNaN(dk)) return;
    const hedef = new Date();
    hedef.setHours(sa, dk, 0, 0);
    if (hedef.getTime() <= Date.now()) hedef.setDate(hedef.getDate() + 1);
    const slug = alarmRastgele ? "__rastgele" : playing || [...favs][0] || stations[0]?.slug;
    if (!slug) return;
    const a = { ts: hedef.getTime(), slug };
    setAlarm(a);
    try { localStorage.setItem("alarm", JSON.stringify(a)); } catch { /* yoksay */ }
    setAlarmAcik(false);
  }

  function alarmKaldir() {
    setAlarm(null);
    try { localStorage.removeItem("alarm"); } catch { /* yoksay */ }
    setAlarmAcik(false);
  }

  useEffect(() => {
    if (!alarm || now <= 0 || now < alarm.ts) return;
    const liste = stationsRef.current;
    const st =
      alarm.slug === "__rastgele"
        ? liste[Math.floor(Math.random() * liste.length)]
        : liste.find((s) => s.slug === alarm.slug);
    setAlarm(null);
    try { localStorage.removeItem("alarm"); } catch { /* yoksay */ }
    if (st && playingRef.current !== st.slug) {
      toggleRef.current(st);
      // Kademeli uyanış: ses 30 saniyede yavaşça hedefe tırmanır.
      const hedefSes = muted ? 0 : volume;
      const audio = audioRef.current;
      if (audio && hedefSes > 0) {
        audio.volume = 0;
        let adim = 0;
        const rampa = setInterval(() => {
          adim++;
          const a = audioRef.current;
          if (!a || adim >= 30) {
            if (a) a.volume = hedefSes;
            clearInterval(rampa);
            return;
          }
          a.volume = Math.min(hedefSes, (adim / 30) * hedefSes);
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, alarm]);

  // --- Birlikte dinle ---
  function odadanAyril(bilgi?: string) {
    odaRef.current?.ayril();
    odaRef.current = null;
    setOda(null);
    setOdaSayi(1);
    if (bilgi) {
      setOdaBilgi(bilgi);
      setTimeout(() => setOdaBilgi(null), 5000);
    }
  }

  async function davetKopyala(kod: string) {
    const link = `${window.location.origin}/?oda=${kod}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ŞİMDİ — birlikte dinle", url: link });
        return;
      }
    } catch { /* paylaşım iptal — panoya düş */ }
    try {
      await navigator.clipboard.writeText(link);
      setOdaBilgi(t("oda.kopyalandi"));
      setTimeout(() => setOdaBilgi(null), 4000);
    } catch { /* yoksay */ }
  }

  function odaAc() {
    if (oda) return;
    const kod = odaKoduUret();
    const k = odaBaglan(kod, "host", { sayi: setOdaSayi, tepki: (ch) => kalpUcur(ch) });
    odaRef.current = k;
    setOda({ kod, rol: "host" });
    if (playingRef.current) k.istasyonYolla(playingRef.current);
    davetKopyala(kod);
  }

  function odayaKatil(kod: string) {
    const k = odaBaglan(kod, "uye", {
      sayi: setOdaSayi,
      tepki: (ch) => kalpUcur(ch),
      istasyon: (slug) => {
        const st = stationsRef.current.find((x) => x.slug === slug);
        if (st && playingRef.current !== slug) toggleRef.current(st);
      },
      hostGitti: () => odadanAyril(t("oda.hostGitti")),
    });
    odaRef.current = k;
    setOda({ kod, rol: "uye" });
    setOdaDavet(null);
    // Davetle gelen yeni dinleyiciye karşılama — kalıcılık teşviki.
    setOdaBilgi(t("oda.hosgeldin"));
    setTimeout(() => setOdaBilgi(null), 9000);
  }

  // Oda sahibi istasyon değiştirince odaya duyur.
  useEffect(() => {
    if (oda?.rol === "host" && playing) odaRef.current?.istasyonYolla(playing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, oda?.rol]);

  useEffect(() => () => { odaRef.current?.ayril(); }, []);

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
      hlsYik(audio);
      setPlaying(null);
      return;
    }
    setPlaying(s.slug);
    setPhase("connecting");
    pushHistory(s.slug);
    audio.volume = muted ? 0 : volume;
    titret(12);
    kaynagiCalistir(audio, s.slug).catch(() => {
      // Otomatik çalma engellendiyse (deep link) sessizce bırak.
      setPlaying(null);
    });
  }

  // İnce dokunsal geri bildirim (Android; desteklemeyen tarayıcı sessizce geçer).
  function titret(ms: number) {
    try {
      navigator.vibrate?.(ms);
    } catch {
      // yoksay
    }
  }

  // Kadran sırasında bir sonraki/önceki istasyona zapla (kilit ekranı ve jest).
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  const stationsRef = useRef(stations);
  stationsRef.current = stations;
  function zapla(delta: number) {
    const liste = stationsRef.current;
    if (!liste.length) return;
    const simdiki = playingRef.current;
    const i = liste.findIndex((s) => s.slug === simdiki);
    const hedef = liste[(i + delta + liste.length) % liste.length] ?? liste[0];
    if (hedef && hedef.slug !== simdiki) toggleRef.current(hedef);
  }
  const zaplaRef = useRef(zapla);
  zaplaRef.current = zapla;

  // Kilit ekranı / bildirim kontrolü — istasyon adı, çalan parça, renkli kapak.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (!playing || !current) {
      ms.metadata = null;
      return;
    }
    const np = liveNP ?? current.nowPlaying;
    const parca =
      np && np.title
        ? np.artist && np.artist !== np.title
          ? `${np.artist} — ${np.title}`
          : np.title
        : null;
    const bilgi = {
      title: parca ?? current.name,
      artist: parca ? current.name : "canlı radyo",
      album: "ŞİMDİ · necaliyor.co",
    };
    const istasyonKapak = { src: kapakUret(current.slug, current.name, accent), sizes: "512x512", type: "image/png" };
    try {
      ms.metadata = new MediaMetadata({ ...bilgi, artwork: [istasyonKapak] });
    } catch { /* MediaMetadata yoksa geç */ }
    ms.playbackState = phase === "playing" ? "playing" : "paused";

    // Şarkının gerçek albüm kapağı (iTunes, müzik kartıyla aynı önbellekli uç):
    // gelince kilit ekranında istasyon kapağının yerini alır.
    const iptal = new AbortController();
    if (np?.artist && np.title && np.artist !== np.title) {
      fetch(`/api/muzik-karti?artist=${encodeURIComponent(np.artist)}&title=${encodeURIComponent(np.title)}`, { signal: iptal.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { kapak?: string | null; album?: string | null } | null) => {
          if (!d?.kapak) return;
          try {
            ms.metadata = new MediaMetadata({
              ...bilgi,
              album: d.album ? `${d.album} · ŞİMDİ` : bilgi.album,
              artwork: [{ src: d.kapak, sizes: "600x600", type: "image/jpeg" }, istasyonKapak],
            });
          } catch { /* yoksay */ }
        })
        .catch(() => {});
    }
    return () => {
      iptal.abort();
      ms.metadata = null;
    };
  }, [playing, current, liveNP, phase, accent]);

  // Kilit ekranı düğmeleri — bir kez bağlanır, ref'lerle güncel kalır.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const dene = (eylem: MediaSessionAction, f: MediaSessionActionHandler) => {
      try {
        ms.setActionHandler(eylem, f);
      } catch {
        // desteklenmeyen eylem
      }
    };
    dene("play", () => {
      const c = stationsRef.current.find((s) => s.slug === playingRef.current);
      if (c) toggleRef.current(c);
    });
    dene("pause", () => {
      const c = stationsRef.current.find((s) => s.slug === playingRef.current);
      if (c) toggleRef.current(c);
    });
    dene("previoustrack", () => zaplaRef.current(-1));
    dene("nexttrack", () => zaplaRef.current(1));
    return () => {
      dene("play", null as unknown as MediaSessionActionHandler);
      dene("pause", null as unknown as MediaSessionActionHandler);
      dene("previoustrack", null as unknown as MediaSessionActionHandler);
      dene("nexttrack", null as unknown as MediaSessionActionHandler);
    };
  }, []);

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
      {/* Masaüstü konsol rayları — geniş ekranda yan boşluğu doldurur (≥1280px). */}
      <KonsolRaylar
        stations={stations}
        favSlugs={Array.from(favs)}
        playing={playing}
        onTune={(slug) => {
          const st = stations.find((x) => x.slug === slug);
          if (st) toggle(st);
        }}
      />

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

      {/* KAYAN MANŞET — köz şeridi (yazar sitesiyle ortak sansasyon dili) */}
      <div className="simdi-marquee" aria-hidden>
        <div className="simdi-marquee-track">
          {[0, 1].map((k) =>
            [
              `${stations.length} ${t("manset.istasyon")}`,
              `${doluUlkeler().length} ${t("manset.ulke")}`,
              t("manset.rota"),
              t("manset.canli"),
            ].map((parca) => <span key={`${k}-${parca}`}>{parca}</span>)
          )}
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-5 pb-32 pt-10">
        {/* Başlık — logo yok, sadece kelime işareti */}
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="brand text-[42px] font-bold leading-none tracking-tight">ŞİMDİ</h1>
            <span
              className="title-underline mt-2 block h-[2px] rounded-full"
              style={{ width: 40, background: accent, opacity: playing ? 1 : 0.25 }}
            />
            <p className="mono mt-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              {t("home.altyazi")}
            </p>
          </div>
          {/* Sağ üst: yalnız dil + ☰ MENÜ. Tema/ton menünün "Görünüm" grubunda. */}
          <div className="flex shrink-0 items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
            <DilToggle />
            <button
              onClick={() => setNavAcik(true)}
              className="menu-hap press"
              aria-haspopup="dialog"
              aria-expanded={navAcik}
            >
              ☰ {dil === "en" ? "MENU" : "MENÜ"}
            </button>
          </div>
        </header>

        {/* Bant seçici — radyo bant düğmesi: FM (buradasın) / Dünya / Nabız */}
        <nav className="bandsel mb-3" aria-label="bant">
          <Link href="/" data-on="1" aria-current="page">FM<span className="sub">{t("home.turkiye")}</span></Link>
          <Link href="/ulke" data-on="0">{t("home.dunya")}<span className="sub">{t("home.atlas")}</span></Link>
          <Link href="/nabiz" data-on="0">{t("nav.nabiz")}<span className="sub">{t("nav.canli")}</span></Link>
        </nav>

        {/* ÜÇ KAPI — dinleyici için sade: liste · harita · takip. Geri kalan her şey ☰ MENÜ'de.
            Alarm, parti, uyku, gezinti yalnız AÇIKKEN durum çipi olarak burada görünür.
            Türkçe İ, text-transform'a emanet edilmez: büyük harf elle. */}
        <nav className="raf mb-5" aria-label="kapılar">
          <Link href="/liste">🏆 {dil === "en" ? "CHART" : "LİSTE"}</Link>
          <Link href="/harita">🌍 {dil === "en" ? "LIVE MAP" : "HARİTA"}</Link>
          <button
            onClick={() => setTakipAcik(true)}
            className={takipSay ? "on" : ""}
            title={dil === "en" ? "search artists, get notified when they play" : "sanatçını ara, radyoda çalınca haber al"}
          >
            🔔 {dil === "en" ? "FOLLOW" : "TAKİP"}
          </button>
          {alarm && (
            <button onClick={() => setAlarmAcik((v) => !v)} className="on" title={t("alarm.baslik")}>
              ⏰ {new Date(alarm.ts).toTimeString().slice(0, 5)}
            </button>
          )}
          {oda && (
            <>
              <button onClick={() => davetKopyala(oda.kod)} className="on" data-kod={oda.kod} title={t("oda.baslik")}>
                👥 {dil === "en" ? "PARTY" : "PARTİ"} · {odaSayi}
              </button>
              {["🔥", "❤️", "🎶"].map((ch) => (
                <button
                  key={ch}
                  onClick={() => {
                    kalpUcur(ch);
                    odaRef.current?.tepkiYolla(ch);
                  }}
                  aria-label={`tepki ${ch}`}
                  style={{ padding: "9px 11px" }}
                >
                  {ch}
                </button>
              ))}
              <button onClick={() => odadanAyril()} title={t("oda.ayril")} style={{ padding: "9px 12px" }}>
                ×
              </button>
            </>
          )}
          {sleepUntil && (
            <button onClick={cycleSleep} className="on" title={t("home.uykuZamanlayici")}>
              🌙 {sleepRemain} DK
            </button>
          )}
          {yolculuk && (
            <button onClick={() => setYolculuk(false)} className="on" title="gezintiyi durdur">
              🧭 {dil === "en" ? "DRIFT" : "GEZİNTİ"} ×
            </button>
          )}
        </nav>

        {/* ⚡ Senkron Anı — aynı şarkı aynı dakikada 2+ radyoda (nadir; son 1 saat) */}
        <SenkronBandi />

        {/* Gece nöbeti — 02:00–05:00 arası özel yüz */}
        <GeceNobeti />

        {/* Wrapped bandı — her ayın ilk 4 günü: kapanan ayın frekans karnesi */}
        {new Date().getDate() <= 4 && (
          <button
            onClick={() => {
              setFrekansKip("ay");
              setFrekansAcik(true);
            }}
            className="press mb-5 flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left"
            style={{ borderColor: "var(--line)" }}
          >
            <span aria-hidden className="text-lg leading-none">🏆</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--fg)" }}>
                {t("wrapped.baslik")}
              </span>
              <span className="epigraf mt-0.5 block text-sm">{t("wrapped.alt")}</span>
            </span>
            <span aria-hidden style={{ color: "var(--muted)" }}>→</span>
          </button>
        )}

        {/* Radyoyla uyan — kurulum paneli */}
        {alarmAcik && (
          <div className="mb-5 rounded-lg border px-4 py-3" style={{ borderColor: "var(--line)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--fg)" }}>
              ⏰ {t("alarm.baslik")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <input
                type="time"
                value={alarmSaat}
                onChange={(e) => setAlarmSaat(e.target.value)}
                className="rounded-md border px-2 py-1"
                style={{ background: "transparent", borderColor: "var(--line)", color: "var(--fg)" }}
                aria-label={t("alarm.baslik")}
              />
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {t("alarm.istasyon")}:{" "}
                {alarmRastgele
                  ? "🎲"
                  : stations.find((s) => s.slug === (playing || [...favs][0] || stations[0]?.slug))?.name || "—"}
              </span>
              <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                <input
                  type="checkbox"
                  checked={alarmRastgele}
                  onChange={(e) => setAlarmRastgele(e.target.checked)}
                />
                {t("alarm.rastgele")}
              </label>
              <button onClick={alarmKur} className="press rounded-full px-3.5 py-1.5 text-xs font-semibold" style={{ background: "var(--fg)", color: "var(--bg)" }}>
                {t("alarm.kur")}
              </button>
              {alarm && (
                <button onClick={alarmKaldir} className="press text-xs underline" style={{ color: "var(--muted)" }}>
                  {t("alarm.kaldir")}
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
              {t("alarm.not")} · {t("alarm.kademeli")}
            </p>
          </div>
        )}

        {/* Birlikte dinle — davet bandı */}
        {odaDavet && !oda && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: "var(--fg)" }}>
            <span aria-hidden className="text-lg leading-none">🎧</span>
            <p className="min-w-0 flex-1 text-sm" style={{ color: "var(--fg)" }}>{t("oda.davet")}</p>
            <button onClick={() => odayaKatil(odaDavet)} className="press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold" style={{ background: "var(--fg)", color: "var(--bg)" }}>
              {t("oda.katil")}
            </button>
            <button onClick={() => setOdaDavet(null)} className="press shrink-0 text-xs underline" style={{ color: "var(--muted)" }}>
              {t("oda.yoksay")}
            </button>
          </div>
        )}
        {odaBilgi && (
          <p className="mb-4 text-xs" role="status" style={{ color: "var(--muted)" }}>
            {odaBilgi}
          </p>
        )}

        {/* Günün epigrafı — boştayken yavaşça döner */}
        {!playing && now > 0 && (
          <p className="epigraf fade-in mb-5 text-lg" key={epi}>
            — {EPIGRAFLAR[epi]}
          </p>
        )}

        {/* KADRAN — analog ayar bandı (yalnız geniş ekranda; mobilde oynatıcı yeter) */}
        <div className="hidden sm:block">
        <Kadran
          stations={shown.map((s) => ({
            slug: s.slug,
            name: s.name,
            accent_color: s.accentColor,
            nowText: s.nowPlaying?.title
              ? [s.nowPlaying.artist, s.nowPlaying.title].filter(Boolean).join(" — ")
              : null,
          }))}
          playing={playing}
          onTune={(slug) => {
            const st = shown.find((x) => x.slug === slug);
            if (st) toggle(st);
          }}
        />
        </div>

        {/* Sanatçı radarı — izlediğin sanatçı şu an bir istasyonda çalıyorsa */}
        <SanatciRadari
          stations={stations}
          onTune={(slug) => {
            const st = stations.find((x) => x.slug === slug);
            if (st) { setUlke(null); setRegion("all"); toggle(st); }
          }}
        />

        {/* Şairin frekansı — Berkay'ın seçkisi (seçki yoksa görünmez) */}
        <SairinFrekansi
          stations={stations}
          onTune={(slug) => {
            const st = stations.find((x) => x.slug === slug);
            if (st) { setUlke(null); setRegion("all"); toggle(st); }
          }}
        />

        {/* Arama */}
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={darEkran ? t("home.araKisa") : t("home.ara")}
          className="field mb-4"
        />

        {/* Ülke ayrımı: Tümü / Türkiye / Yabancı */}
        <div
          className="mb-4 inline-flex rounded-full border p-0.5 text-xs"
          style={{ borderColor: "var(--line)" }}
        >
          {(
            [
              ["all", `${t("home.hepsi")} ${stations.length}`],
              ["tr", `${t("home.turkiye")} ${trCount}`],
              ["int", `${t("home.dunya")} ${intCount}`],
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

        {/* Filtreler — ikincil kontrolleri katla, üst temiz kalsın */}
        <button
          onClick={() => setFiltrelerAcik((v) => !v)}
          className="chip mb-4 ml-2 align-middle"
          data-on={filtrelerAcik ? "1" : "0"}
          aria-expanded={filtrelerAcik}
        >
          ⚙ {t("home.filtreler")} {filtrelerAcik ? "▲" : "▼"}
        </button>

        {filtrelerAcik && (
        <>
        {/* Kadran ülke bandı — bayrağa dokun: liste + kadran o ülkeye ayarlanır */}
        <div className="no-scrollbar mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm">
          {doluUlkeler().map((k) => {
            const aktif = ulke === k;
            return (
              <button
                key={k}
                onClick={() => { setUlke(aktif ? null : k); if (!aktif) setRegion("all"); }}
                className="press shrink-0 rounded-full border px-2.5 py-1"
                style={{
                  borderColor: aktif ? "var(--accent)" : "var(--line)",
                  background: aktif ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
                  color: aktif ? "var(--fg)" : "var(--muted)",
                }}
                title={ULKELER[k].tr}
                aria-pressed={aktif}
              >
                {bayrakEmoji(k)}{aktif ? ` ${ULKELER[k].tr}` : ""}
              </button>
            );
          })}
          {ulke ? (
            <>
              <Link href={`/ulke/${ulkeSlug(ulke as Parameters<typeof ulkeSlug>[0])}`} className="shrink-0 text-xs underline" style={{ color: "var(--muted)" }}>
                {t("home.sayfasi")} →
              </Link>
              <button onClick={() => setUlke(null)} className="press shrink-0 text-xs" style={{ color: "var(--muted)" }} aria-label="ülke filtresini kaldır">
                ✕
              </button>
            </>
          ) : (
            <Link href="/ulke" className="shrink-0 text-xs underline" style={{ color: "var(--muted)" }}>
              {t("home.atlas")} →
            </Link>
          )}
        </div>

        {/* Favori filtresi + sıralama + Şairin Frekansı */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={() => {
              // 🌍 beni şaşırt: rastgele bir dünya ülkesi + rastgele istasyonu çal
              const uks = doluUlkeler().filter((k) => k !== "tr");
              const k = uks[Math.floor(Math.random() * uks.length)];
              const adaylar = stations.filter((s) => istasyonUlkesi(s.slug) === k);
              if (adaylar.length === 0) return;
              setUlke(k); setRegion("all"); setSairMode(false);
              toggle(adaylar[Math.floor(Math.random() * adaylar.length)]);
            }}
            className="chip"
            title={t("home.beniSasirtIpucu")}
          >
            🌍 {t("home.beniSasirt")}
          </button>
          <button onClick={() => setSairMode((v) => !v)} className="chip" data-on={sairMode ? "1" : "0"}>
            ✍ {t("home.sairinFrekansi")}
          </button>
          <button onClick={() => setFavOnly((v) => !v)} className="chip" data-on={favOnly ? "1" : "0"}>
            {favOnly ? `★ ${t("home.favoriler")}` : `☆ ${t("home.favoriler")}`}
          </button>
          <button onClick={() => setSort((s) => (s === "liste" ? "az" : s === "az" ? "tur" : "liste"))} className="chip">
            {t("home.sira")}: {sort === "liste" ? t("home.siraOne") : sort === "az" ? "A-Z" : t("home.siraTur")}
          </button>
        </div>
        </>
        )}

        {/* Tür filtresi çipleri (sayılı) */}
        {genres.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setGenre(null)} className="chip chip-solid" data-on={genre === null ? "1" : "0"}>
              {t("home.tumu")}
            </button>
            {(turHepsi ? genres : genres.filter(([g], i) => i < 6 || g === genre)).map(([g, n]) => {
              const active = genre === g;
              return (
                <button key={g} onClick={() => setGenre(active ? null : g)} className="chip chip-solid" data-on={active ? "1" : "0"}>
                  {turAdi(dil, g)} <span style={{ opacity: 0.55 }}>{n}</span>
                </button>
              );
            })}
            {genres.length > 6 && (
              <button onClick={() => setTurHepsi((v) => !v)} className="chip chip-solid" aria-expanded={turHepsi}>
                {turHepsi ? (dil === "en" ? "less ▴" : "daha az ▴") : `+${genres.length - 6}`}
              </button>
            )}
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
                className="mb-6 flex items-center gap-4 rounded-2xl border p-5"
                style={{
                  borderColor: `color-mix(in srgb, ${fc} 32%, var(--line))`,
                  background: `radial-gradient(120% 150% at 0% 0%, color-mix(in srgb, ${fc} 26%, transparent), transparent 58%), linear-gradient(180deg, var(--panel-hi), var(--panel))`,
                }}
              >
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${fc}, color-mix(in srgb, ${fc} 50%, #000))`,
                    color: readableOn(fc),
                    boxShadow: `0 10px 26px color-mix(in srgb, ${fc} 40%, transparent)`,
                  }}
                >
                  {featured.name.trim().charAt(0).toLocaleUpperCase("tr")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mono block text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                    🎧 {t("home.neDinlesem")}{" "}
                    <button onClick={suggestAnother} className="nav-link">
                      {t("home.baskaOner")} ↻
                    </button>
                  </span>
                  <span className="dial mt-1 block truncate text-2xl uppercase tracking-[0.03em]" style={{ fontWeight: 500 }}>{featured.name}</span>
                  <span className="mono block truncate text-[11px]" style={{ color: "var(--muted)" }}>
                    {[turAdi(dil, featured.genre || ""), featured.frequency, featured.city].filter(Boolean).join(" · ") || t("radyo.canliRadyo")}
                  </span>
                </span>
                <button
                  onClick={() => toggle(featured)}
                  className="dial press shrink-0 rounded-full px-6 py-3 text-sm uppercase tracking-[0.08em]"
                  style={{ background: fc, color: readableOn(fc), fontWeight: 500, boxShadow: `0 8px 22px color-mix(in srgb, ${fc} 38%, transparent)` }}
                >
                  ▶ {t("home.cal")}
                </button>
              </div>
            );
          })()
        )}

        {/* "Şu an çalanlar" yatay şerit */}
        {!playing && nowStrip.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              {t("home.simdiCalanlar")}
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
                {t("home.filtreleriTemizle")}
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
                  className={`station-card row-in group flex w-full items-center px-2${tazeler[s.id] && !isPlaying ? " np-taze" : ""}`}
                  style={{
                    background: isPlaying
                      ? `color-mix(in srgb, ${c} 15%, transparent)`
                      : undefined,
                    borderColor: isPlaying ? `color-mix(in srgb, ${c} 45%, var(--line))` : undefined,
                    boxShadow: isPlaying ? `inset 3px 0 0 ${c}` : undefined,
                    animationDelay: `${Math.min(i, 18) * 22}ms`,
                    ["--taze-renk" as string]: c,
                  }}
                >
                  <button
                    onClick={() => toggle(s)}
                    className="press flex min-w-0 flex-1 items-center gap-4 py-3 pl-1.5 pr-2 text-left"
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
                      <span className="mono mt-1 block truncate text-[11px] tracking-[0.02em]" style={{ color: "var(--muted)" }}>
                        {SAIR_SET.has(s.slug) ? <span title={t("home.sairinFrekansi")}>✍ </span> : ""}
                        {s.band === "int" ? `${bayrakEmoji(istasyonUlkesi(s.slug))} ` : ""}
                        <span style={{ color: c }}>{s.name}</span>
                        {s.frequency ? ` · ${s.frequency}` : ""}
                        {s.city ? ` · ${s.city}` : ""}
                        {isPlaying && phase === "connecting"
                          ? ` · ${t("player.baglaniyor")}`
                          : np
                            ? isPlaying && liveNP
                              ? ` · ${t("radyo.canli")}`
                              : (() => {
                                  const rel = np.updatedAt ? since(np.updatedAt, now || Date.now()) : "";
                                  return rel ? ` · ${rel}` : "";
                                })()
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
                  {/* Anonim kalp — çalmayı tetiklemez */}
                  <button
                    onClick={() => kalpAt(s.slug)}
                    aria-label="kalp gönder"
                    title="bu istasyona kalp gönder"
                    className="press shrink-0 px-1.5 py-4 text-sm leading-none"
                    style={{ color: kalpler[s.slug] ? "#e0475f" : "var(--muted)" }}
                  >
                    ♥{kalpler[s.slug] ? <span className="ml-0.5 text-xs tabular-nums">{kalpler[s.slug]}</span> : ""}
                  </button>
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

        {/* Listenin altı: dünyadan canlı kesit + kalp defteri (dinleyiciyi listeden önce yormasın) */}
        <div className="mt-10">
        {/* Dünyada şu an — rastgele ülkelerden canlı kesit */}
        <DunyadaSimdi
          stations={stations}
          onTune={(slug) => {
            const st = stations.find((x) => x.slug === slug);
            if (st) { setUlke(null); setRegion("all"); toggle(st); }
          }}
        />

        {/* Kalp defteri şeridi — son anılar akar */}
        <DefterSeridi stations={stations} />

        </div>

        {/* Kitap köprüsü — tek satır, sayfanın dibinde */}
        <p className="mt-10 text-center text-xs" style={{ color: "var(--muted)" }}>
          📖 {t("kopru.kitap")}{" "}
          <a
            href="https://www.berkaydogan.co/kitaplar/tasfiye"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--fg)" }}
          >
            Tasfiye
          </a>
        </p>
      </div>

      {/* Alt çalma çubuğu — çalan istasyonun renginde */}
      {current && (
        <div
          className="nowbar-float fixed inset-x-0 bottom-0 z-10 border-t"
          style={{ ["--pa" as string]: accent }}
        >
          <div
            className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3"
            style={{
              color: "var(--fg)",
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              touchAction: "pan-y",
            }}
            onTouchStart={(e) => {
              jestRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }}
            onTouchEnd={(e) => {
              const j = jestRef.current;
              if (!j) return;
              jestRef.current = null;
              const dx = e.changedTouches[0].clientX - j.x;
              const dy = e.changedTouches[0].clientY - j.y;
              if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 2) {
                titret(10);
                zapla(dx < 0 ? 1 : -1); // sola kaydır → sonraki istasyon
              }
            }}
          >
            <button onClick={() => toggle(current)} aria-label="Durdur" className="press pbar-ana">
              <span className="flex gap-[3px]">
                <span className="h-4 w-[3px] rounded-sm" style={{ background: readableOn(accent) }} />
                <span className="h-4 w-[3px] rounded-sm" style={{ background: readableOn(accent) }} />
              </span>
            </button>
            {/* Canlı dalga (çalarken) */}
            {phase === "playing" && (
              <span
                className="eq hidden items-end gap-[2px] sm:flex"
                style={{ ["--eq-color" as string]: accent }}
                aria-hidden
              >
                <span /><span /><span /><span /><span />
              </span>
            )}
            {/* ♪ Mini kapak — bulunursa albüm kapağı; dokun: müzik kartı */}
            {barNp?.artist && (
              <KapakMini
                key={`${barNp.artist}|${barNp.title ?? ""}`}
                artist={barNp.artist}
                title={barNp.title}
                onClick={() => setMuzikKart({ artist: barNp.artist!, title: barNp.title })}
              />
            )}
            <button
              onClick={() => barNp?.artist && setMuzikKart({ artist: barNp.artist, title: barNp.title })}
              className="min-w-0 flex-1 text-left"
              title={barNp?.artist ? "parça hakkında — müzik kartı" : undefined}
              disabled={!barNp?.artist}
            >
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
            </button>

            {/* Yalnız değilsin — aynı istasyonda şu an kaç kişi */}
            {dinleyiciSayi > 1 && (
              <span
                className="pbar-cip fade-in shrink-0"
                title={`şu an ${dinleyiciSayi} kişi bu istasyonda — yalnız değilsin`}
              >
                <Ikon ad="kulaklik" /> {dinleyiciSayi}
              </span>
            )}

            {/* ♪ Sanatçı — görünür kimlik: ada dokun, müzik kartı (bio+konser) açılsın */}
            {barNp?.artist && (
              <button
                onClick={() => setMuzikKart({ artist: barNp.artist!, title: barNp.title })}
                className="pbar-cip press cip-masa shrink-0"
                title={`${barNp.artist} — hakkında & konserler`}
              >
                ♪ {barNp.artist.length > 16 ? barNp.artist.slice(0, 15) + "…" : barNp.artist}
              </button>
            )}

            {/* Favori yıldızı — çalarken tek dokunuşla kaydet */}
            <button
              onClick={() => toggleFav(current.slug)}
              aria-label={favs.has(current.slug) ? "favoriden çıkar" : "favorilere ekle"}
              title={favs.has(current.slug) ? "favoriden çıkar" : "favorilere ekle"}
              className="pbar-cip press shrink-0"
              style={favs.has(current.slug) ? { color: "#ffcf4d" } : undefined}
            >
              <Ikon ad="yildiz" dolu={favs.has(current.slug)} />
            </button>

            {/* Anonim kalp — mobilde ⋯ menüsünde */}
            <button
              onClick={() => kalpAt(current.slug)}
              aria-label="bu istasyona kalp gönder"
              title="bu istasyona kalp gönder"
              className="pbar-cip press cip-masa shrink-0"
            >
              <Ikon ad="kalp" />{kalpler[current.slug] ? ` ${kalpler[current.slug]}` : ""}
            </button>

            {/* Şarkı yakala — çalan parçayı av defterine at */}
            {barNp && (barNp.artist || barNp.title) && (
              <button
                onClick={() => {
                  avEkle({
                    t: Date.now(),
                    artist: barNp.artist ?? null,
                    title: barNp.title ?? null,
                    slug: current.slug,
                    istasyon: current.name,
                  });
                  setAvGeri(Date.now());
                  setTimeout(() => setAvGeri(0), 1400);
                }}
                aria-label={t("av.yakala")}
                title={t("av.yakala")}
                className="pbar-cip press shrink-0"
              >
                {avGeri ? `✓ ${t("av.yakalandi")}` : <Ikon ad="yakala" />}
              </button>
            )}

            {/* Kalp defteri — dinlerken not bırak (mobilde ⋯ menüsünde) */}
            <button
              onClick={() => setDefterAcik(true)}
              aria-label="kalp defteri — bu istasyona not bırak"
              title="kalp defteri: dinlerken bir anı bırak"
              className="pbar-cip press cip-masa shrink-0"
            >
              <Ikon ad="not" />
            </button>

            {/* Paylaşılabilir kart (mobilde ⋯ menüsünde) */}
            <button
              onClick={() => setKartAcik(true)}
              aria-label="kartı paylaş"
              title="şu an çalanı kart olarak paylaş (k)"
              className="pbar-cip press cip-masa shrink-0"
            >
              <Ikon ad="kart" />
            </button>

            {/* ⋯ — mobil oynatıcı menüsü: kart paylaş, not, kalp, sanatçı… hepsi burada */}
            <button
              onClick={() => setCipMenu(true)}
              aria-label="oynatıcı menüsü"
              title="daha fazla — kart, not, kalp…"
              className="pbar-cip press cip-cep shrink-0"
              aria-haspopup="dialog"
            >
              ⋯
            </button>

            {/* Sessizlik / odak modu (mobilde ⋯ menüsünde) */}
            <button
              onClick={() => setFocus(true)}
              aria-label="sessizlik modu"
              title="sessizlik modu (f)"
              className="press hidden shrink-0 text-lg leading-none sm:inline-flex"
              style={{ color: "var(--fg)" }}>
              <Ikon ad="odak" boy={17} />
            </button>

            {/* Ses seviyesi + sessize alma (geniş ekranda) */}
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              {/* Gece modu (ses eşitleme) geçici olarak kapalı: Web Audio, CORS izni
                  vermeyen yayınları SUSTURUYOR (çoğu istasyon). Röle tabanlı v2 gelecek. */}
              <button
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "sesi aç" : "sessize al"}
                className="press text-base leading-none"
                style={{ color: "var(--fg)" }}
              >
                {muted || volume === 0 ? <Ikon ad="sessiz" boy={17} /> : <Ikon ad="ses" boy={17} />}
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
                style={{ color: accent }}
              />
            </div>

            {/* Şarkıyı Spotify / YouTube'da aç (mobilde ⋯ menüsünde) */}
            {barQuery && (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(barQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Spotify'da ara"
                  className="pbar-cip"
                >
                  Spotify
                </a>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(barQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube'da ara"
                  className="pbar-cip"
                >
                  YouTube
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ☰ MENÜ — sitenin bütün kapıları tek yerde (her ekranda). Ana sayfa sade kalsın
          diye raflardan kalkan her şey burada: Dinle · Keşfet · Senin. */}
      {navAcik && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-label="menü">
          <button
            className="absolute inset-0"
            style={{ background: "color-mix(in srgb, #000 62%, transparent)" }}
            onClick={() => setNavAcik(false)}
            aria-label="menüyü kapat"
          />
          <div className="menu-sayfa absolute inset-x-0 bottom-0 rounded-t-2xl p-5 pb-8 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
            <div className="mb-3 flex items-center justify-between">
              <span className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                ŞİMDİ · {dil === "en" ? "MENU" : "MENÜ"}
              </span>
              <button onClick={() => setNavAcik(false)} className="press text-xl leading-none" aria-label="kapat">×</button>
            </div>

            <p className="menu-grup">{dil === "en" ? "LISTEN" : "DİNLE"}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setNavAcik(false); setSurus(true); }} className="menu-kalem press">🚗 {dil === "en" ? "drive mode" : "sürüş modu"}</button>
              <button onClick={() => { cycleSleep(); }} className={`menu-kalem press ${sleepUntil ? "on" : ""}`}>
                🌙 {sleepUntil ? `${sleepRemain} dk` : dil === "en" ? "sleep timer" : "uyku"}
              </button>
              <button onClick={() => { setNavAcik(false); setAlarmAcik(true); }} className={`menu-kalem press ${alarm ? "on" : ""}`}>
                ⏰ {alarm ? new Date(alarm.ts).toTimeString().slice(0, 5) : dil === "en" ? "radio alarm" : "radyo alarmı"}
              </button>
              <button onClick={() => { setNavAcik(false); if (oda) davetKopyala(oda.kod); else odaAc(); }} className={`menu-kalem press ${oda ? "on" : ""}`}>
                👥 {dil === "en" ? "listen together" : "birlikte dinle"}
              </button>
              <button onClick={() => { setYolculuk((v) => !v); setNavAcik(false); }} className={`menu-kalem press ${yolculuk ? "on" : ""}`}>
                🧭 {dil === "en" ? "drift" : "gezinti"}
              </button>
              <button onClick={() => { setNavAcik(false); setNotAcik(true); }} className="menu-kalem press">✍ {dil === "en" ? "leave a note" : "not bırak"}</button>
            </div>

            <p className="menu-grup">{dil === "en" ? "EXPLORE" : "KEŞFET"}</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/kesif" className="menu-kalem" onClick={() => setNavAcik(false)}>🎧 {t("nav.kesif")}</Link>
              <Link href="/ulke" className="menu-kalem" onClick={() => setNavAcik(false)}>🗺 atlas</Link>
              <Link href="/arsiv" className="menu-kalem" onClick={() => setNavAcik(false)}>⏳ {dil === "en" ? "time machine" : "zaman makinesi"}</Link>
              <Link href="/nabiz" className="menu-kalem" onClick={() => setNavAcik(false)}>📈 {t("nav.nabiz")}</Link>
              <Link href="/endeks" className="menu-kalem" onClick={() => setNavAcik(false)}>📰 {dil === "en" ? "radio index" : "radyo endeksi"}</Link>
              <Link href="/rekorlar" className="menu-kalem" onClick={() => setNavAcik(false)}>🎖 {dil === "en" ? "records" : "rekorlar"}</Link>
              <Link href="/senkron" className="menu-kalem" onClick={() => setNavAcik(false)}>⚡ {dil === "en" ? "sync moments" : "senkron defteri"}</Link>
              <Link href="/gece" className="menu-kalem" onClick={() => setNavAcik(false)}>🌙 {dil === "en" ? "3 AM chart" : "gece 3 listesi"}</Link>
              <Link href="/oyun" className="menu-kalem" onClick={() => setNavAcik(false)}>🎮 {dil === "en" ? "games" : "oyunlar"}</Link>
              <Link href="/fal" className="menu-kalem" onClick={() => setNavAcik(false)}>🔮 {dil === "en" ? "fortune" : "frekans falı"}</Link>
              <Link href="/kose" className="menu-kalem" onClick={() => setNavAcik(false)}>✒ {t("nav.kose")}</Link>
              <button onClick={() => { setNavAcik(false); audioRef.current?.pause(); setPlaying(null); setSiirAcik(true); }} className="menu-kalem press col-span-2">📖 {dil === "en" ? "poetry corner · Şiir Rafım Radio" : "şiir köşesi · Şiir Rafım Radyosu"}</button>
            </div>

            <p className="menu-grup">{dil === "en" ? "YOURS" : "SENİN"}</p>
            <div className="grid grid-cols-2 gap-2">
              {!kuruluMu() && (
                <button
                  onClick={() => { setNavAcik(false); setKurAcik(true); }}
                  className="menu-kalem press col-span-2"
                  style={{ borderColor: "color-mix(in srgb, var(--glow) 55%, var(--line-hi))" }}
                >
                  📲 {dil === "en" ? "install as an app" : "uygulama gibi kur"}
                </button>
              )}
              <button onClick={() => { setNavAcik(false); setTakipAcik(true); }} className="menu-kalem press">🔔 {dil === "en" ? "follow artists" : "sanatçı takip"}</button>
              <button onClick={() => { setNavAcik(false); setAvAcik(true); }} className="menu-kalem press">🎣 {t("nav.avlarim")}</button>
              <button onClick={() => { setNavAcik(false); setFrekansAcik(true); }} className="menu-kalem press">📻 {t("nav.frekansim")}</button>
              <button onClick={() => { setNavAcik(false); setKasaAcik(true); }} className="menu-kalem press">🔐 {dil === "en" ? "memory code" : "hafıza kodum"}</button>
              <Link href="/hakkinda" className="menu-kalem col-span-2" onClick={() => setNavAcik(false)}>ℹ {t("nav.gelistirici")}</Link>
            </div>

            <p className="menu-grup">{dil === "en" ? "LOOK" : "GÖRÜNÜM"}</p>
            <div className="flex items-center gap-4 px-1 text-sm" style={{ color: "var(--muted)" }}>
              <ThemeToggle />
              <ToneToggle />
            </div>
          </div>
        </div>
      )}

      {/* ⋯ OYNATICI MENÜSÜ (mobil) — kart, not, kalp, sanatçı, odak… tek sayfada */}
      {cipMenu && current && (
        <div className="fixed inset-0 z-[70] sm:hidden" role="dialog" aria-label="oynatıcı menüsü">
          <button
            className="absolute inset-0"
            style={{ background: "color-mix(in srgb, #000 62%, transparent)" }}
            onClick={() => setCipMenu(false)}
            aria-label="menüyü kapat"
          />
          <div className="menu-sayfa absolute inset-x-0 bottom-0 rounded-t-2xl p-5 pb-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="mono min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                {current.name}
              </span>
              <button onClick={() => setCipMenu(false)} className="press text-xl leading-none" aria-label="kapat">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {barNp?.artist && (
                <button
                  onClick={() => { setCipMenu(false); setMuzikKart({ artist: barNp.artist!, title: barNp.title }); }}
                  className="menu-kalem press col-span-2"
                >
                  ♪ {barNp.artist.length > 24 ? barNp.artist.slice(0, 23) + "…" : barNp.artist}
                </button>
              )}
              <button onClick={() => { setCipMenu(false); setKartAcik(true); }} className="menu-kalem press">
                <Ikon ad="kart" /> {dil === "en" ? "share card" : "kartı paylaş"}
              </button>
              <button onClick={() => { setCipMenu(false); setDefterAcik(true); }} className="menu-kalem press">
                <Ikon ad="not" /> {dil === "en" ? "leave a note" : "not bırak"}
              </button>
              <button onClick={() => { kalpAt(current.slug); setCipMenu(false); }} className="menu-kalem press">
                <Ikon ad="kalp" /> {dil === "en" ? "send a heart" : "kalp gönder"}
                {kalpler[current.slug] ? ` · ${kalpler[current.slug]}` : ""}
              </button>
              <button onClick={() => { setCipMenu(false); setFocus(true); }} className="menu-kalem press">
                <Ikon ad="odak" /> {dil === "en" ? "focus mode" : "sessizlik modu"}
              </button>
              {barQuery && (
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(barQuery)}`}
                  target="_blank" rel="noopener noreferrer" className="menu-kalem"
                  onClick={() => setCipMenu(false)}
                >
                  Spotify&apos;da ara
                </a>
              )}
              {barQuery && (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(barQuery)}`}
                  target="_blank" rel="noopener noreferrer" className="menu-kalem"
                  onClick={() => setCipMenu(false)}
                >
                  YouTube&apos;da ara
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📲 Uygulama kur sihirbazı */}
      <KurSihirbazi acik={kurAcik} kapat={() => setKurAcik(false)} dil={dil} />

      {/* 🚗 Sürüş modu — favoriler (yoksa ilk Türk istasyonları) arasında dev düğmelerle */}
      {surus && (
        <SurusModu
          liste={(() => {
            const fav = stations.filter((x) => favs.has(x.slug));
            const dolgu = stations.filter((x) => x.band === "tr" && !favs.has(x.slug));
            return [...fav, ...dolgu].slice(0, Math.max(6, fav.length)).map((x) => ({ slug: x.slug, name: x.name, accentColor: x.accentColor }));
          })()}
          calan={playing}
          baglaniyor={phase === "connecting"}
          parca={barNp ? { artist: barNp.artist ?? null, title: barNp.title ?? barNp.rawTitle ?? null } : null}
          istasyonAdi={current?.name ?? null}
          onCal={(slug) => { const st = stations.find((x) => x.slug === slug); if (st) toggle(st); }}
          kapat={() => setSurus(false)}
          dil={dil}
        />
      )}

      {/* 🔔 Sanatçı ara + takip · 🔐 hafıza kodu · ⬆ yukarı çık */}
      <SanatciTakip acik={takipAcik} kapat={() => setTakipAcik(false)} dil={dil} kurAc={() => setKurAcik(true)} />
      <KasaModal acik={kasaAcik} kapat={() => setKasaAcik(false)} dil={dil} />
      <SiirKosesi acik={siirAcik} kapat={() => setSiirAcik(false)} dil={dil} />
      <YukariCik oynaticiVar={!!current} />

      {/* Sadece bu satırdan ses çıkar; görünmez. Kesilirse yeniden bağlanır. */}
      <audio
        ref={audioRef}
        onWaiting={() => {
          if (playingRef.current) setPhase("connecting");
        }}
        onPlaying={() => {
          retriesRef.current = 0;
          setPhase("playing");
          // Wrapped günlüğü: yayın GERÇEKTEN başladıysa anonim dinleme düş.
          if (playingRef.current) dinlemeKaydet(playingRef.current);
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

      {/* Frekans Kartı — kişisel dinleme karnesi */}
      {frekansAcik && (
        <FrekansKarti
          stations={stations.map((s) => ({
            slug: s.slug,
            name: s.name,
            genre: s.genre ?? null,
            accentColor: s.accentColor ?? null,
          }))}
          onClose={() => {
            setFrekansAcik(false);
            setFrekansKip("hep");
          }}
          baslangicKip={frekansKip}
        />
      )}

      {avAcik && <AvDefteri onClose={() => setAvAcik(false)} />}

      {/* ♪ Müzik kartı — çalan parçanın kimliği */}
      {muzikKart && (
        <MuzikKarti
          artist={muzikKart.artist}
          title={muzikKart.title}
          accent={accent}
          onClose={() => setMuzikKart(null)}
        />
      )}

      {/* Kalp defteri modalı — not bırakmak artık iki dokunuş: raf ✍ → yaz. */}
      {notAcik && (
        <div className="fixed inset-0 z-50" role="dialog" aria-label={t("defter.baslik")}>
          <button aria-label="kapat" onClick={() => setNotAcik(false)} className="absolute inset-0 h-full w-full" style={{ background: "rgba(0,0,0,0.6)" }} />
          <div
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-2xl border-t px-5 pb-10 pt-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
            style={{ background: "var(--bg)", borderColor: "var(--line)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">✍ {t("defter.baslik")}</span>
              <button onClick={() => setNotAcik(false)} className="press rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
                {t("frekans.kapat")}
              </button>
            </div>
            {current ? (
              <>
                <p className="mb-3 text-xs" style={{ color: "var(--muted)" }}>
                  {dil === "en" ? "your note goes to" : "notun şu istasyonun defterine yazılır:"}{" "}
                  <strong style={{ color: "var(--fg)" }}>{current.name}</strong>
                </p>
                <Notlar slug={current.slug} accent={accent} />
              </>
            ) : (
              <p className="read text-sm" style={{ color: "var(--muted)" }}>
                {dil === "en"
                  ? "tap a station first — your note is written into that station's guestbook."
                  : "önce bir istasyona dokun — notun o istasyonun defterine yazılır. aşağıdaki defter şeridinde başkalarının bıraktıklarını görebilirsin."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Uçan kalpler — seninkiler ve aynı frekanstakilerinkiler */}
      {ucanKalpler.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 h-[45vh] overflow-hidden" aria-hidden>
          {ucanKalpler.map((u) => (
            <span
              key={u.id}
              className="kalp-uc absolute bottom-0 text-2xl"
              style={{ left: `${u.x}%`, color: accent }}
            >
              {u.ch || "♥"}
            </span>
          ))}
        </div>
      )}

      {/* iOS "ana ekrana ekle" ipucu — bir kez görünür */}
      {pwaIpucu && (
        <div
          className="fade-in fixed inset-x-0 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg"
          style={{
            background: "var(--bg)",
            borderColor: "var(--line)",
            bottom: "calc(84px + env(safe-area-inset-bottom))",
          }}
        >
          <span aria-hidden>📱</span>
          <span className="flex-1">
            ŞİMDİ&apos;yi uygulama yap: <b>Paylaş</b> → <b>Ana Ekrana Ekle</b>
          </span>
          <button
            onClick={() => {
              setPwaIpucu(false);
              try {
                localStorage.setItem("pwa-ipucu", "1");
              } catch {
                // yoksay
              }
            }}
            aria-label="ipucunu kapat"
            className="press rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: "var(--line)", color: "var(--muted)" }}
          >
            tamam
          </button>
        </div>
      )}

      {/* Kalp defteri — alttan kayan panel; dinlerken not oku / bırak */}
      {defterAcik && current && (
        <div className="fixed inset-0 z-50" role="dialog" aria-label="kalp defteri">
          <button
            aria-label="kapat"
            onClick={() => setDefterAcik(false)}
            className="absolute inset-0 h-full w-full"
            style={{ background: "rgba(0,0,0,0.55)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[72vh] max-w-2xl overflow-y-auto rounded-t-2xl border-t px-5 pb-10 pt-3"
            style={{ background: "var(--bg)", borderColor: "var(--line)" }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: "var(--line)" }} />
            <div className="mb-1 flex items-center justify-between">
              <span className="dial text-base uppercase tracking-[0.04em]" style={{ fontWeight: 500 }}>{current.name}</span>
              <button
                onClick={() => setDefterAcik(false)}
                aria-label={t("frekans.kapat")}
                className="chip"
              >
                {t("frekans.kapat")}
              </button>
            </div>
            <Notlar slug={current.slug} accent={accent} />
          </div>
        </div>
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
