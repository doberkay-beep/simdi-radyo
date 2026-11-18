"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { kaynagiCalistir, hlsYik } from "@/lib/cal";
import { temizMetin } from "@/lib/cop";
import { useDil, turAdi } from "@/lib/i18n";
import { bayrakEmoji, istasyonUlkesi } from "@/lib/ulkeler";

// Mağaza kabuğu (/uygulama): yalnız yazılı izinli radyolar. Bütün veri ?uygulama=1 ile gelir.
// Bilerek sade: site sayfalarına (nabız, harita, arşiv, radyo/sanatçı sayfaları) bağlantı YOK,
// çünkü o sayfalar izinsiz radyoları da gösterir. Dış bağlantılar (Spotify, YouTube, site) yeni
// pencerede açılır; kurulu uygulamada bu, tarayıcıya gider.

type Calan = { artist: string | null; title: string | null; rawTitle: string | null; updatedAt: string } | null;
type Istasyon = {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  frequency: string | null;
  band: "tr" | "int" | "own";
  genre: string | null;
  logoUrl?: string | null;
  nowPlaying: Calan;
};

const FAV_KEY = "favoriler"; // ana sayfayla ortak: favoriler iki yerde aynı
const YENILE_MS = 10_000;
const CANLI_MS = 15_000;

const METIN = {
  tr: {
    soru: "Radyoda şu an ne çalıyor?",
    ara: "Radyo, şarkı ya da sanatçı ara",
    hepsi: "hepsi",
    turkiye: "Türkiye",
    dunya: "dünya",
    favoriler: "favoriler",
    bos: "Aramana uyan radyo yok.",
    yukleniyor: "Radyolar geliyor…",
    hata: "Bağlantı kurulamadı. Birazdan yeniden denenecek.",
    durdur: "durdur",
    baglaniyor: "bağlanıyor…",
    calamadi: "bu radyo şu an çalamadı",
    izin: "Buradaki her radyo, yayınının uygulamada yer alması için yazılı izin verdi.",
    favEkle: "favorilere ekle",
    favCikar: "favoriden çıkar",
    ses: "ses",
  },
  en: {
    soru: "What's on the radio right now?",
    ara: "Search a station, song or artist",
    hepsi: "all",
    turkiye: "Türkiye",
    dunya: "world",
    favoriler: "favourites",
    bos: "No station matches your search.",
    yukleniyor: "Loading stations…",
    hata: "Couldn't connect. Trying again shortly.",
    durdur: "stop",
    baglaniyor: "connecting…",
    calamadi: "this station can't play right now",
    izin: "Every station here has given written permission for its stream to appear in the app.",
    favEkle: "add to favourites",
    favCikar: "remove from favourites",
    ses: "volume",
  },
} as const;

const kucuk = (s: string) => s.toLocaleLowerCase("tr");

export default function UygulamaKabugu({ ilkIstasyonlar }: { ilkIstasyonlar: Istasyon[] }) {
  const { dil } = useDil();
  const m = METIN[dil === "en" ? "en" : "tr"];
  const [istasyonlar, setIstasyonlar] = useState<Istasyon[]>(ilkIstasyonlar);
  const [durum, setDurum] = useState<"hazir" | "yukleniyor" | "hata">(ilkIstasyonlar.length ? "hazir" : "yukleniyor");
  const [arama, setArama] = useState("");
  const [bolge, setBolge] = useState<"hepsi" | "tr" | "int">("hepsi");
  const [tur, setTur] = useState<string | null>(null);
  const [yalnizFav, setYalnizFav] = useState(false);
  const [favlar, setFavlar] = useState<Set<string>>(new Set());
  const [calan, setCalan] = useState<string | null>(null);
  const [faz, setFaz] = useState<"bos" | "baglaniyor" | "caliyor" | "hata">("bos");
  const [canli, setCanli] = useState<Calan>(null);
  const [ses, setSes] = useState(1);
  const sesRef = useRef<HTMLAudioElement | null>(null);

  // Favoriler (ana sayfayla aynı anahtar).
  useEffect(() => {
    try {
      const ham = localStorage.getItem(FAV_KEY);
      if (ham) setFavlar(new Set(JSON.parse(ham) as string[]));
    } catch {
      // yoksay
    }
  }, []);
  const favDegistir = useCallback((slug: string) => {
    setFavlar((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(slug)) yeni.delete(slug);
      else yeni.add(slug);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...yeni]));
      } catch {
        // yoksay
      }
      return yeni;
    });
  }, []);

  // Liste: yalnız izinli radyolar, 10 sn'de bir (sekme görünürken).
  useEffect(() => {
    let bitti = false;
    async function yukle() {
      if (document.visibilityState === "hidden") return;
      try {
        const r = await fetch("/api/now?uygulama=1", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const veri = (await r.json()) as { stations?: Istasyon[] };
        if (!bitti && veri.stations) {
          setIstasyonlar(veri.stations);
          setDurum("hazir");
        }
      } catch {
        if (!bitti) setDurum((d) => (d === "yukleniyor" ? "hata" : d));
      }
    }
    yukle();
    const iv = setInterval(yukle, YENILE_MS);
    document.addEventListener("visibilitychange", yukle);
    return () => {
      bitti = true;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", yukle);
    };
  }, []);

  // Çalan radyonun başlığı yayının kendisinden (ses ile yazı aynı kalsın).
  useEffect(() => {
    setCanli(null);
    if (!calan) return;
    let bitti = false;
    async function cek() {
      try {
        const r = await fetch(`/api/live/${encodeURIComponent(calan!)}?uygulama=1`, { cache: "no-store" });
        if (!r.ok) return;
        const v = (await r.json()) as { live?: Calan };
        if (!bitti && v.live) setCanli({ ...v.live, updatedAt: new Date().toISOString() });
      } catch {
        // yoksay
      }
    }
    cek();
    const iv = setInterval(cek, CANLI_MS);
    return () => {
      bitti = true;
      clearInterval(iv);
    };
  }, [calan]);

  useEffect(() => {
    if (sesRef.current) sesRef.current.volume = ses;
  }, [ses]);

  // Medya tuşları ve Windows'un medya penceresi.
  const calanIstasyon = istasyonlar.find((s) => s.slug === calan) ?? null;
  const calanParca = canli ?? calanIstasyon?.nowPlaying ?? null;
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!calanIstasyon) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const sarki = [temizMetin(calanParca?.artist), temizMetin(calanParca?.title)].filter(Boolean).join(" — ");
    navigator.mediaSession.metadata = new MediaMetadata({
      title: sarki || calanIstasyon.name,
      artist: sarki ? calanIstasyon.name : "nowby.",
      album: "nowby.",
      artwork: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
    });
  }, [calanIstasyon, calanParca]);

  const durdur = useCallback(() => {
    const a = sesRef.current;
    if (a) {
      a.pause();
      hlsYik(a);
      a.removeAttribute("src");
      a.load();
    }
    setCalan(null);
    setFaz("bos");
  }, []);

  const cal = useCallback(
    (slug: string) => {
      const a = sesRef.current;
      if (!a) return;
      if (calan === slug) {
        durdur();
        return;
      }
      setCalan(slug);
      setFaz("baglaniyor");
      a.volume = ses;
      kaynagiCalistir(a, slug)
        .then(() => setFaz("caliyor"))
        .catch(() => setFaz("hata"));
    },
    [calan, durdur, ses],
  );

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("pause", durdur);
    navigator.mediaSession.setActionHandler("stop", durdur);
    return () => {
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
  }, [durdur]);

  const turler = useMemo(() => {
    const say = new Map<string, number>();
    for (const s of istasyonlar) if (s.genre) say.set(s.genre, (say.get(s.genre) ?? 0) + 1);
    return [...say.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [istasyonlar]);
  const dunyaVar = istasyonlar.some((s) => s.band === "int");

  const gorunen = useMemo(() => {
    const q = kucuk(arama.trim());
    const liste = istasyonlar.filter((s) => {
      if (bolge === "tr" && s.band === "int") return false;
      if (bolge === "int" && s.band !== "int") return false;
      if (tur && s.genre !== tur) return false;
      if (yalnizFav && !favlar.has(s.slug)) return false;
      if (!q) return true;
      const np = s.nowPlaying;
      return [s.name, s.city, np?.artist, np?.title].some((x) => x && kucuk(x).includes(q));
    });
    // Favoriler en üstte; gerisi sunucunun sırasıyla.
    return [...liste.filter((s) => favlar.has(s.slug)), ...liste.filter((s) => !favlar.has(s.slug))];
  }, [istasyonlar, arama, bolge, tur, yalnizFav, favlar]);

  const cip = (etkin: boolean) =>
    ({
      background: "none",
      border: 0,
      borderBottom: `1px solid ${etkin ? "var(--glow)" : "transparent"}`,
      color: etkin ? "var(--fg)" : "var(--muted)",
      font: "inherit",
      fontSize: 17,
      padding: "2px 0",
      cursor: "pointer",
    }) as const;

  const sarkiYazisi = calanParca
    ? [temizMetin(calanParca.artist), temizMetin(calanParca.title)].filter(Boolean).filter((x, i, d) => d.indexOf(x) === i).join(" — ")
    : "";

  return (
    <main className="sergi" style={{ paddingBottom: calan ? 140 : 60 }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "28px 0 8px" }}>
        <span className="brand" style={{ fontWeight: 700, fontSize: 20 }}>
          nowby<span style={{ color: "var(--glow)" }}>.</span>
        </span>
        <span style={{ color: "var(--muted)", fontStyle: "italic", fontSize: 17 }}>{m.soru}</span>
      </header>

      <div className="sergi-kontrol" style={{ marginTop: 28 }}>
        <input
          type="search"
          className="field"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder={m.ara}
          aria-label={m.ara}
          style={{ background: "none", border: 0, borderBottom: "1px solid", outline: "none" }}
        />
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }} aria-label="süzgeç">
          <button type="button" style={cip(bolge === "hepsi" && !tur && !yalnizFav)} onClick={() => { setBolge("hepsi"); setTur(null); setYalnizFav(false); }}>
            {m.hepsi}
          </button>
          {dunyaVar ? (
            <>
              <button type="button" style={cip(bolge === "tr")} onClick={() => setBolge(bolge === "tr" ? "hepsi" : "tr")}>{m.turkiye}</button>
              <button type="button" style={cip(bolge === "int")} onClick={() => setBolge(bolge === "int" ? "hepsi" : "int")}>{m.dunya}</button>
            </>
          ) : null}
          <button type="button" style={cip(yalnizFav)} onClick={() => setYalnizFav((x) => !x)}>
            {yalnizFav ? "★" : "☆"} {m.favoriler}
          </button>
          {turler.map((g) => (
            <button key={g} type="button" style={cip(tur === g)} onClick={() => setTur(tur === g ? null : g)}>
              {turAdi(dil, g)}
            </button>
          ))}
        </nav>
      </div>

      {durum === "yukleniyor" ? <p style={{ color: "var(--muted)" }}>{m.yukleniyor}</p> : null}
      {durum === "hata" ? <p style={{ color: "var(--muted)" }}>{m.hata}</p> : null}
      {durum === "hazir" && gorunen.length === 0 ? <p style={{ color: "var(--muted)" }}>{m.bos}</p> : null}

      <div className="sergi-duvar">
        {gorunen.map((s) => {
          const np = s.slug === calan && canli ? canli : s.nowPlaying;
          const sanatci = temizMetin(np?.artist);
          const baslik = temizMetin(np?.title);
          const ayni = sanatci && baslik && sanatci === baslik;
          const yer = [s.band === "int" ? bayrakEmoji(istasyonUlkesi(s.slug)) : null, s.frequency, s.city].filter(Boolean).join(" · ");
          const fav = favlar.has(s.slug);
          return (
            <article key={s.id} className={`eser${s.slug === calan ? " calan" : ""}`}>
              <button type="button" className="eser-cal" onClick={() => cal(s.slug)} aria-pressed={s.slug === calan}>
                <span className="eser-logo" aria-hidden>
                  {s.slug === calan && faz === "caliyor" ? (
                    <span className="eq flex items-end gap-[2px]"><span /><span /><span /><span /></span>
                  ) : (
                    <>
                      <span>{[...s.name][0]?.toLocaleUpperCase("tr")}</span>
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : null}
                    </>
                  )}
                </span>
                <span className="eser-ad">{s.name}</span>
                <span className="eser-sarki">
                  {np && (sanatci || baslik) ? (
                    ayni || !sanatci ? baslik : (<>{sanatci}{baslik ? <em> {baslik}</em> : null}</>)
                  ) : (
                    <em>{s.genre ? turAdi(dil, s.genre) : ""}</em>
                  )}
                </span>
                {yer ? <span className="eser-kunye">{yer}</span> : null}
              </button>
              <div className="eser-eylem">
                <button type="button" onClick={() => favDegistir(s.slug)} aria-label={fav ? m.favCikar : m.favEkle} title={fav ? m.favCikar : m.favEkle}>
                  {fav ? "★" : "☆"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p style={{ marginTop: 60, color: "var(--muted)", fontStyle: "italic", fontSize: 15 }}>
        {m.izin}{" "}
        <a href="https://nowby.co" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>nowby.co</a>
        {" · "}
        <a href="https://berkaydogan.co" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>Berkay Doğan</a>
      </p>

      {calanIstasyon ? (
        <div
          role="region"
          aria-label="çalar"
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
            display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
            padding: "16px clamp(20px,5vw,80px)", background: "var(--bg)", borderTop: "1px solid var(--line-hi)",
          }}
        >
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-baslik), Georgia, serif", fontSize: 22, color: "var(--glow)" }}>{calanIstasyon.name}</div>
            <div style={{ color: "var(--muted)", fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {faz === "baglaniyor" ? m.baglaniyor : faz === "hata" ? m.calamadi : sarkiYazisi}
            </div>
          </div>
          {sarkiYazisi && faz === "caliyor" ? (
            <div style={{ display: "flex", gap: 16, fontSize: 16 }}>
              <a href={`https://open.spotify.com/search/${encodeURIComponent(sarkiYazisi)}`} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>Spotify</a>
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(sarkiYazisi)}`} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>YouTube</a>
            </div>
          ) : null}
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 15 }}>
            {m.ses}
            <input type="range" min={0} max={1} step={0.05} value={ses} onChange={(e) => setSes(Number(e.target.value))} style={{ width: 110 }} />
          </label>
          <button type="button" onClick={durdur} style={{ background: "none", border: "1px solid var(--line-hi)", color: "var(--fg)", font: "inherit", fontSize: 16, padding: "6px 16px", cursor: "pointer" }}>
            {m.durdur}
          </button>
        </div>
      ) : null}

      <audio ref={sesRef} preload="none" onError={() => calan && setFaz("hata")} />
    </main>
  );
}
