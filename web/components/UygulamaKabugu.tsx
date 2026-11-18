"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { kaynagiCalistir, hlsYik } from "@/lib/cal";
import { temizMetin } from "@/lib/cop";
import { useDil, turAdi } from "@/lib/i18n";
import { ULKELER, bayrakUrl, istasyonUlkesi, type UlkeKodu } from "@/lib/ulkeler";

// Mağaza kabuğu (/uygulama): yalnız yazılı izinli radyolar; bütün veri ?uygulama=1 ile gelir.
// Görsel dil Mac uygulamasıyla ortak (GenisDuzen: kenar çubuğu + kartlar + altta TamSerit).
// Bilerek sade: site sayfalarına (nabız, harita, arşiv, radyo/sanatçı sayfaları) bağlantı YOK,
// çünkü o sayfalar izinsiz radyoları da gösterir. Dış bağlantılar yeni pencerede (tarayıcıda) açılır.

type Calan = { artist: string | null; title: string | null; rawTitle: string | null; updatedAt: string } | null;
type Istasyon = {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  frequency: string | null;
  accentColor: string | null;
  band: "tr" | "int" | "own";
  genre: string | null;
  country?: string | null;
  nowPlaying: Calan;
};

const FAV_KEY = "favoriler"; // sitenin ana sayfasıyla ortak
const YENILE_MS = 10_000;
const CANLI_MS = 15_000;
const ATES = "#ff6a3d"; // Mac'teki Köz teması vurgusu; rengi olmayan radyonun rozeti

const METIN = {
  tr: {
    dinle: "Dinle", radyolar: "Radyolar", favoriler: "Favorilerin", hakkinda: "nowby.",
    ara: "Radyo, şarkı ya da sanatçı ara", hepsi: "Hepsi", canli: (n: number) => `${n} radyoda şu an bir şarkı çalıyor`,
    bos: "Aramana uyan radyo yok.", favBos: "Henüz favorin yok. Bir radyonun yıldızına dokun, burada dursun.",
    yukleniyor: "Radyolar geliyor…", hata: "Bağlantı kurulamadı. Birazdan yeniden denenecek.",
    durdur: "Durdur", cal: "Çal", baglaniyor: "bağlanıyor…", calamadi: "bu radyo şu an çalamadı",
    izin: "Buradaki her radyo, yayınının uygulamada yer alması için yazılı izin verdi.",
    favEkle: "Favorilere ekle", favCikar: "Favorilerden çıkar", ses: "Ses", site: "nowby.co", yazar: "Berkay Doğan",
  },
  en: {
    dinle: "Listen", radyolar: "Radio", favoriler: "Your Favorites", hakkinda: "nowby.",
    ara: "Search stations, songs or artists", hepsi: "All", canli: (n: number) => `A song is playing on ${n} stations right now`,
    bos: "No station matches your search.", favBos: "No favorites yet. Tap a station's star to keep it here.",
    yukleniyor: "Loading stations…", hata: "Couldn't connect. Trying again shortly.",
    durdur: "Stop", cal: "Play", baglaniyor: "connecting…", calamadi: "this station can't play right now",
    izin: "Every station here has given written permission for its stream to appear in the app.",
    favEkle: "Add to favorites", favCikar: "Remove from favorites", ses: "Volume", site: "nowby.co", yazar: "Berkay Doğan",
  },
} as const;

const kucuk = (s: string) => s.toLocaleLowerCase("tr");
const renkOf = (s: Istasyon) => (s.accentColor && /^#?[0-9a-f]{6}$/i.test(s.accentColor) ? (s.accentColor.startsWith("#") ? s.accentColor : `#${s.accentColor}`) : ATES);
const ulkeOf = (s: Istasyon) => (s.country ?? istasyonUlkesi(s.slug)) as UlkeKodu;

function parca(np: Calan) {
  const sanatci = temizMetin(np?.artist) || "";
  const baslik = temizMetin(np?.title) || temizMetin(np?.rawTitle) || "";
  if (!baslik && !sanatci) return null;
  if (!baslik || baslik === sanatci) return { baslik: baslik || sanatci, sanatci: "" };
  return { baslik, sanatci };
}

// SF Symbols karşılıkları (dot.radiowaves, star, magnifyingglass, play/pause, speaker).
const Simge = {
  radyo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="2" fill="currentColor" /><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" /></svg>,
  yildiz: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" /></svg>,
  ara: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8" /></svg>,
  cal: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>,
  dur: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></svg>,
  sesAz: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9h4l5-4v14l-5-4H4z" /></svg>,
  sesCok: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg>,
};

function Cubuk() {
  return <span className="uyg-cubuk" aria-hidden><i /><i /><i /></span>;
}

export default function UygulamaKabugu({ ilkIstasyonlar }: { ilkIstasyonlar: Istasyon[] }) {
  const { dil } = useDil();
  const m = METIN[dil === "en" ? "en" : "tr"];
  const [istasyonlar, setIstasyonlar] = useState<Istasyon[]>(ilkIstasyonlar);
  const [durum, setDurum] = useState<"hazir" | "yukleniyor" | "hata">(ilkIstasyonlar.length ? "hazir" : "yukleniyor");
  const [bolum, setBolum] = useState<"radyolar" | "favoriler">("radyolar");
  const [arama, setArama] = useState("");
  const [ulke, setUlke] = useState<string | null>(null);
  const [tur, setTur] = useState<string | null>(null);
  const [favlar, setFavlar] = useState<Set<string>>(new Set());
  const [calan, setCalan] = useState<string | null>(null);
  const [faz, setFaz] = useState<"bos" | "baglaniyor" | "caliyor" | "duraklatildi" | "hata">("bos");
  const [canli, setCanli] = useState<Calan>(null);
  const [ses, setSes] = useState(1);
  const [kaydi, setKaydi] = useState(false);
  const sesRef = useRef<HTMLAudioElement | null>(null);

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

  // Liste: yalnız izinli radyolar, 10 sn'de bir (pencere görünürken).
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

  const calanIstasyon = istasyonlar.find((s) => s.slug === calan) ?? null;
  const calanParca = parca(canli ?? calanIstasyon?.nowPlaying ?? null);

  // Windows'un medya penceresi ve klavye medya tuşları.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!calanIstasyon) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: calanParca?.baslik || calanIstasyon.name,
      artist: calanParca ? [calanParca.sanatci, calanIstasyon.name].filter(Boolean).join(" · ") : "nowby.",
      album: "nowby.",
      artwork: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
    });
  }, [calanIstasyon, calanParca]);

  const baslat = useCallback(
    (slug: string) => {
      const a = sesRef.current;
      if (!a) return;
      setCalan(slug);
      setFaz("baglaniyor");
      a.volume = ses;
      kaynagiCalistir(a, slug)
        .then(() => setFaz("caliyor"))
        .catch(() => setFaz("hata"));
    },
    [ses],
  );

  // Canlı yayında "duraklat" = bağlantıyı kes; devam edince yayına yeniden bağlanır (geride kalmaz).
  const duraklat = useCallback(() => {
    const a = sesRef.current;
    if (a) {
      a.pause();
      hlsYik(a);
      a.removeAttribute("src");
      a.load();
    }
    setFaz("duraklatildi");
  }, []);

  const degistir = useCallback(() => {
    if (!calan) return;
    if (faz === "caliyor" || faz === "baglaniyor") duraklat();
    else baslat(calan);
  }, [calan, faz, duraklat, baslat]);

  const kartaBas = useCallback(
    (slug: string) => {
      if (calan === slug && (faz === "caliyor" || faz === "baglaniyor")) duraklat();
      else baslat(slug);
    },
    [calan, faz, duraklat, baslat],
  );

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => calan && baslat(calan));
    ms.setActionHandler("pause", duraklat);
    ms.setActionHandler("stop", duraklat);
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("stop", null);
    };
  }, [calan, baslat, duraklat]);

  // Ülke ve tür çipleri, Mac'teki sırayla: sayıya göre.
  const ulkeler = useMemo(() => {
    const say = new Map<string, number>();
    for (const s of istasyonlar) say.set(ulkeOf(s), (say.get(ulkeOf(s)) ?? 0) + 1);
    return [...say.entries()].sort((a, b) => b[1] - a[1]);
  }, [istasyonlar]);
  const turler = useMemo(() => {
    const say = new Map<string, number>();
    for (const s of istasyonlar) if (s.genre) say.set(s.genre, (say.get(s.genre) ?? 0) + 1);
    return [...say.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [istasyonlar]);
  const calanSayi = useMemo(() => istasyonlar.filter((s) => parca(s.nowPlaying)).length, [istasyonlar]);

  const gorunen = useMemo(() => {
    const q = kucuk(arama.trim());
    return istasyonlar.filter((s) => {
      if (bolum === "favoriler" && !favlar.has(s.slug)) return false;
      if (ulke && ulkeOf(s) !== ulke) return false;
      if (tur && s.genre !== tur) return false;
      if (!q) return true;
      const np = s.nowPlaying;
      return [s.name, s.city, np?.artist, np?.title].some((x) => x && kucuk(x).includes(q));
    });
  }, [istasyonlar, arama, bolum, ulke, tur, favlar]);

  const ulkeAdi = (kod: string) => {
    const u = ULKELER[kod as UlkeKodu];
    return u ? u[dil === "en" ? "en" : "tr"] : kod.toUpperCase();
  };

  return (
    <div className="uyg">
      <nav className="uyg-kenar" aria-label="nowby.">
        <div className="uyg-kenar-baslik">{m.dinle}</div>
        <button type="button" className="uyg-kenar-ogesi" aria-current={bolum === "radyolar"} onClick={() => setBolum("radyolar")}>
          {Simge.radyo}
          {m.radyolar}
          <span className="uyg-kenar-sayi">{istasyonlar.length || ""}</span>
        </button>
        <button type="button" className="uyg-kenar-ogesi" aria-current={bolum === "favoriler"} onClick={() => setBolum("favoriler")}>
          {Simge.yildiz}
          {m.favoriler}
          <span className="uyg-kenar-sayi">{favlar.size || ""}</span>
        </button>
        <p className="uyg-kenar-not">
          {m.izin}
          <br />
          <br />
          <a href="https://nowby.co" target="_blank" rel="noopener">{m.site}</a>
          {" · "}
          <a href="https://berkaydogan.co" target="_blank" rel="noopener">{m.yazar}</a>
        </p>
      </nav>

      <main className="uyg-icerik" onScroll={(e) => setKaydi(e.currentTarget.scrollTop > 90)} style={{ paddingBottom: calanIstasyon ? 110 : 40 }}>
        <div className="uyg-ust">
          <span className="uyg-ust-ad" data-gorunur={kaydi ? "1" : "0"}>nowby</span>
          <label className="uyg-ara">
            {Simge.ara}
            <input type="search" value={arama} onChange={(e) => setArama(e.target.value)} placeholder={m.ara} aria-label={m.ara} />
          </label>
        </div>

        <h1 className="uyg-buyuk">
          nowby<span>.</span>
        </h1>
        <div className="uyg-canli">
          <i aria-hidden />
          {m.canli(calanSayi)}
        </div>

        {ulkeler.length > 1 ? (
          <div className="uyg-cipler" role="group" aria-label="ülke">
            <button type="button" className="uyg-cip" aria-pressed={!ulke} onClick={() => setUlke(null)}>
              🌍 {m.hepsi}
            </button>
            {ulkeler.map(([kod, n]) => {
              const bayrak = bayrakUrl(kod as UlkeKodu);
              return (
                <button key={kod} type="button" className="uyg-cip" aria-pressed={ulke === kod} onClick={() => setUlke(ulke === kod ? null : kod)}>
                  {bayrak ? <img src={bayrak} alt="" loading="lazy" /> : <span aria-hidden>🌐</span>}
                  {ulkeAdi(kod)}
                  <small>{n}</small>
                </button>
              );
            })}
          </div>
        ) : null}
        {turler.length > 1 ? (
          <div className="uyg-cipler" role="group" aria-label="tür">
            <button type="button" className="uyg-cip tur" aria-pressed={!tur} onClick={() => setTur(null)}>
              {m.hepsi}
            </button>
            {turler.map((g) => (
              <button key={g} type="button" className="uyg-cip tur" aria-pressed={tur === g} onClick={() => setTur(tur === g ? null : g)}>
                {turAdi(dil, g)}
              </button>
            ))}
          </div>
        ) : null}

        {durum === "yukleniyor" ? <p className="uyg-bos">{m.yukleniyor}</p> : null}
        {durum === "hata" ? <p className="uyg-bos">{m.hata}</p> : null}
        {durum === "hazir" && gorunen.length === 0 ? <p className="uyg-bos">{bolum === "favoriler" && favlar.size === 0 ? m.favBos : m.bos}</p> : null}

        <div className="uyg-izgara">
          {gorunen.map((s) => {
            const buCalan = s.slug === calan;
            const p = parca(buCalan && canli ? canli : s.nowPlaying);
            const fav = favlar.has(s.slug);
            const yer = [s.city, s.frequency].filter(Boolean).join(" · ");
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                className="uyg-kart"
                data-calan={buCalan && faz !== "duraklatildi" ? "1" : "0"}
                style={{ "--renk": renkOf(s) } as CSSProperties}
                onClick={() => kartaBas(s.slug)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    kartaBas(s.slug);
                  }
                }}
                aria-label={`${s.name}${p ? ` — ${p.baslik}` : ""}`}
              >
                <div className="uyg-kart-ust">
                  <span className="uyg-rozet" aria-hidden>
                    {buCalan && faz === "caliyor" ? <Cubuk /> : [...s.name][0]?.toLocaleUpperCase("tr")}
                  </span>
                  <span className="uyg-kart-ad">{s.name}</span>
                  <button
                    type="button"
                    className="uyg-yildiz"
                    aria-pressed={fav}
                    aria-label={fav ? m.favCikar : m.favEkle}
                    title={fav ? m.favCikar : m.favEkle}
                    onClick={(e) => {
                      e.stopPropagation();
                      favDegistir(s.slug);
                    }}
                  >
                    {fav ? "★" : "☆"}
                  </button>
                </div>
                <div className="uyg-kart-baslik" data-bos={p ? "0" : "1"}>{p ? p.baslik : s.genre ? turAdi(dil, s.genre) : s.name}</div>
                <div className="uyg-kart-alt">{p ? p.sanatci || yer : yer}</div>
              </div>
            );
          })}
        </div>
      </main>

      {calanIstasyon ? (
        <div className="uyg-serit" role="region" aria-label="çalar" style={{ "--renk": renkOf(calanIstasyon) } as CSSProperties}>
          <div className="uyg-serit-sol">
            <span className="uyg-serit-kapak" aria-hidden>
              {faz === "caliyor" ? <Cubuk /> : [...calanIstasyon.name][0]?.toLocaleUpperCase("tr")}
            </span>
            <div className="uyg-serit-yazi">
              <b>{faz === "hata" ? m.calamadi : calanParca?.baslik || calanIstasyon.name}</b>
              <span>
                {faz === "baglaniyor"
                  ? m.baglaniyor
                  : calanParca?.sanatci
                    ? `${calanParca.sanatci} · ${calanIstasyon.name}`
                    : calanIstasyon.name}
              </span>
            </div>
          </div>
          <div className="uyg-serit-orta">
            <button type="button" className="uyg-dugme ana" onClick={degistir} aria-label={faz === "caliyor" || faz === "baglaniyor" ? m.durdur : m.cal}>
              {faz === "baglaniyor" ? <span className="uyg-yukleniyor" /> : faz === "caliyor" ? Simge.dur : Simge.cal}
            </button>
            <button
              type="button"
              className="uyg-dugme"
              aria-pressed={favlar.has(calanIstasyon.slug)}
              aria-label={favlar.has(calanIstasyon.slug) ? m.favCikar : m.favEkle}
              onClick={() => favDegistir(calanIstasyon.slug)}
            >
              {favlar.has(calanIstasyon.slug) ? <span style={{ fontSize: 17 }}>★</span> : <span style={{ fontSize: 17 }}>☆</span>}
            </button>
          </div>
          <div className="uyg-serit-sag">
            {calanParca && faz === "caliyor" ? (
              <>
                <a href={`https://open.spotify.com/search/${encodeURIComponent([calanParca.sanatci, calanParca.baslik].filter(Boolean).join(" "))}`} target="_blank" rel="noopener">Spotify</a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent([calanParca.sanatci, calanParca.baslik].filter(Boolean).join(" "))}`} target="_blank" rel="noopener">YouTube</a>
              </>
            ) : null}
            {Simge.sesAz}
            <input className="uyg-ses" type="range" min={0} max={1} step={0.02} value={ses} onChange={(e) => setSes(Number(e.target.value))} aria-label={m.ses} />
            {Simge.sesCok}
          </div>
        </div>
      ) : null}

      <audio ref={sesRef} preload="none" onError={() => calan && faz !== "duraklatildi" && setFaz("hata")} />
    </div>
  );
}
