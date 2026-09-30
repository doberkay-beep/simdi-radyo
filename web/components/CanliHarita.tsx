"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { KOORDINAT, bayrakEmoji, istasyonUlkesi, type UlkeKodu } from "@/lib/ulkeler";
import { simdiDinle } from "@/lib/canli";
import { temizMetin } from "@/lib/cop";
import { avEkle } from "@/lib/avlar";
import Ikon from "./Ikon";
import { DUNYA_YOLLARI } from "@/lib/dunya-yollari";

/* CANLI HARİTA — imparatorluğun vitrini: gerçek dünya, ülke sınırları, her
   istasyon bir ışık. Şarkı değişen nokta parlar ve akış şeridine düşer;
   noktaya ya da şerit satırına DOKUN → radyo BURADA çalar (sayfadan çıkmadan).
   Tam ekran/TV-arkası/embed dostu (?embed=1). */

const W = 1440;
const H = 720;

function xy(lat: number, lng: number): [number, number] {
  return [((lng + 180) / 360) * W, ((90 - lat) / 180) * H];
}

/* Slug'dan deterministik saçılım — ülkenin istasyonları başkent çevresine
   yıldız kümesi gibi dağılır (her yüklemede aynı yerde). */
function sacilim(slug: string): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) { h ^= slug.charCodeAt(i); h = Math.imul(h, 16777619); }
  const a = ((h >>> 0) % 1000) / 1000;
  const b = ((h >>> 10) % 1000) / 1000;
  return [(a - 0.5) * 7, (b - 0.5) * 4.5];
}

type Ist = {
  id: number; slug: string; name: string; accentColor: string | null;
  nowPlaying: { artist: string | null; title: string | null } | null;
};
type Nokta = Ist & { x: number; y: number; ulke: UlkeKodu };
type Akis = { id: number; metin: string; ulke: UlkeKodu; slug: string; name: string };

export default function CanliHarita({ embed = false }: { embed?: boolean }) {
  const [noktalar, setNoktalar] = useState<Nokta[]>([]);
  const [tazeler, setTazeler] = useState<Record<number, number>>({});
  const [akis, setAkis] = useState<Akis[]>([]);
  const [gunesBoylami, setGunesBoylami] = useState(0);
  const [calan, setCalan] = useState<{ slug: string; name: string; ulke: UlkeKodu } | null>(null);
  const [favlar, setFavlar] = useState<Set<string>>(new Set());
  const [yakalandi, setYakalandi] = useState(0);
  const kokRef = useRef<HTMLDivElement | null>(null);
  const sesRef = useRef<HTMLAudioElement | null>(null);
  const noktaRef = useRef<Map<number, Nokta>>(new Map());

  useEffect(() => {
    // Ana sayfayla AYNI favori defteri (localStorage "favoriler").
    try {
      const ham = localStorage.getItem("favoriler");
      if (ham) setFavlar(new Set(JSON.parse(ham)));
    } catch { /* yok say */ }
    const hesapla = () => {
      const s = new Date();
      setGunesBoylami((12 - (s.getUTCHours() + s.getUTCMinutes() / 60)) * 15);
    };
    hesapla();
    const id = setInterval(hesapla, 60000);
    return () => { clearInterval(id); sesRef.current?.pause(); };
  }, []);

  useEffect(() => {
    fetch("/api/now", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const liste: Nokta[] = (d.stations ?? [])
          .map((s: Ist & { slug: string }) => {
            const ulke = istasyonUlkesi(s.slug);
            const koor = KOORDINAT[ulke];
            if (!koor) return null;
            const [dLng, dLat] = sacilim(s.slug);
            const [x, y] = xy(koor[0] + dLat, koor[1] + dLng);
            return { ...s, x, y, ulke };
          })
          .filter(Boolean);
        setNoktalar(liste);
        noktaRef.current = new Map(liste.map((n: Nokta) => [n.id, n]));
      })
      .catch(() => {});

    const ayril = simdiDinle((deg) => {
      const n = noktaRef.current.get(deg.station_id);
      if (!n) return;
      n.nowPlaying = { artist: temizMetin(deg.artist), title: temizMetin(deg.title) };
      setNoktalar((prev) => prev.map((p) => (p.id === deg.station_id ? { ...p, nowPlaying: n.nowPlaying } : p)));
      setTazeler((t) => ({ ...t, [deg.station_id]: Date.now() }));
      setTimeout(() => {
        setTazeler((t) => { const y = { ...t }; delete y[deg.station_id]; return y; });
      }, 5000);
      const artist = temizMetin(deg.artist);
      const title = temizMetin(deg.title);
      if (!artist && !title) return;
      if (`${artist}${title}`.includes("~")) return; // ham metadata sızıntısı
      setAkis((a) => [
        { id: Date.now() + deg.station_id, metin: `${n.name}: ${[artist, title].filter(Boolean).join(" — ")}`, ulke: n.ulke, slug: n.slug, name: n.name },
        ...a,
      ].slice(0, 7));
    });
    return ayril;
  }, []);

  /* Haritadan ayrılmadan çal — nokta ya da şerit satırı dokunuşuyla. */
  function cal(slug: string, name: string, ulke: UlkeKodu) {
    const a = sesRef.current;
    if (!a) return;
    if (calan?.slug === slug) {
      a.pause();
      setCalan(null);
      return;
    }
    a.src = `/api/stream/${slug}?r=${Date.now()}`;
    a.play().catch(() => {});
    setCalan({ slug, name, ulke });
  }

  function favToggle(slug: string) {
    setFavlar((eski) => {
      const yeni = new Set(eski);
      if (yeni.has(slug)) yeni.delete(slug); else yeni.add(slug);
      try { localStorage.setItem("favoriler", JSON.stringify([...yeni])); } catch { /* yok say */ }
      return yeni;
    });
  }

  function yakala() {
    if (!calan) return;
    const np = [...noktaRef.current.values()].find((n) => n.slug === calan.slug)?.nowPlaying;
    if (!np || (!np.artist && !np.title)) return;
    avEkle({ t: Date.now(), artist: np.artist ?? null, title: np.title ?? null, slug: calan.slug, istasyon: calan.name });
    setYakalandi(Date.now());
    setTimeout(() => setYakalandi(0), 1500);
  }

  const geceX = ((((gunesBoylami + 180) % 360) + 360) % 360) / 360 * W;
  const ulkeSayisi = useMemo(() => new Set(noktalar.map((n) => n.ulke)).size, [noktalar]);

  function tamEkran() {
    const el = kokRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  return (
    <div ref={kokRef} className="relative flex h-screen flex-col overflow-hidden" style={{ background: "#050308" }}>
      {!embed && (
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-y-2 px-6 py-4">
          <Link href="/" className="brand text-xl font-bold tracking-tight" style={{ color: "#f2e6da" }}>
            ŞİMDİ <span style={{ color: "#8d6f63" }}>· canlı harita</span>
          </Link>
          <span className="mono flex items-center gap-4 text-[11px] uppercase tracking-[0.18em]" style={{ color: "#b0938a" }}>
            {calan && (
              <span className="flex items-center gap-2">
                <button
                  onClick={() => cal(calan.slug, calan.name, calan.ulke)}
                  className="press flex items-center gap-2 rounded-full px-3.5 py-1.5 normal-case tracking-normal"
                  style={{ background: "#e5382c", color: "#fff", fontWeight: 700 }}
                >
                  ⏸ {bayrakEmoji(calan.ulke)} {calan.name}
                </button>
                <button
                  onClick={() => favToggle(calan.slug)}
                  aria-label="favorilere ekle"
                  title={favlar.has(calan.slug) ? "favoriden çıkar" : "favorilere ekle"}
                  className="press flex items-center rounded-full border px-2.5 py-1.5"
                  style={{ borderColor: "#43201a", color: favlar.has(calan.slug) ? "#ffcf4d" : "#e9b9a4" }}
                >
                  <Ikon ad="yildiz" dolu={favlar.has(calan.slug)} />
                </button>
                <button
                  onClick={yakala}
                  aria-label="şarkıyı yakala"
                  title="şarkıyı yakala — av defterine at"
                  className="press flex items-center gap-1 rounded-full border px-2.5 py-1.5 normal-case tracking-normal"
                  style={{ borderColor: "#43201a", color: "#e9b9a4" }}
                >
                  {yakalandi ? "✓" : <Ikon ad="yakala" />}
                </button>
              </span>
            )}
            <span>{noktalar.length} istasyon · {ulkeSayisi} ülke</span>
            <span className="flex items-center gap-1.5">
              <span className="live-dot inline-block h-2 w-2 rounded-full" style={{ background: "#3ddc84" }} />
              canlı
            </span>
            <button onClick={tamEkran} className="press rounded-full border px-3 py-1" style={{ borderColor: "#43201a", color: "#e9b9a4" }}>
              ⛶ tam ekran
            </button>
          </span>
        </header>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="min-h-0 w-full flex-1" preserveAspectRatio="xMidYMid meet" role="img" aria-label="dünyada şu an çalan radyolar">
        <defs>
          <linearGradient id="gece" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.55" />
            <stop offset="0.12" stopColor="#000" stopOpacity="0" />
            <stop offset="0.88" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="parla">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dünya — gerçek kıtalar, görünür ülke sınırları */}
        <g>
          {DUNYA_YOLLARI.map((d, i) => (
            <path key={i} d={d} fill="#180d13" stroke="#311a20" strokeWidth={0.7} />
          ))}
        </g>

        {/* Gece örtüsü */}
        <rect x={((geceX + W / 2) % W) - W} y={0} width={W} height={H} fill="url(#gece)" />
        <rect x={(geceX + W / 2) % W} y={0} width={W} height={H} fill="url(#gece)" />

        {/* İstasyon ışıkları — dokun, BURADA çalsın */}
        {noktalar.map((n) => {
          const renk = n.accentColor || "#ff9b76";
          const canliMi = !!(n.nowPlaying && (n.nowPlaying.artist || n.nowPlaying.title));
          const taze = !!tazeler[n.id];
          const buCaliyor = calan?.slug === n.slug;
          return (
            <g key={n.slug} className="cursor-pointer" onClick={() => cal(n.slug, n.name, n.ulke)}>
              {taze && <circle cx={n.x} cy={n.y} r={16} fill="url(#parla)" opacity={0.7} />}
              {buCaliyor && (
                <circle cx={n.x} cy={n.y} r={9} fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.9}>
                  <animate attributeName="r" values="7;11;7" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={n.x} cy={n.y} r={taze ? 5 : buCaliyor ? 4.5 : canliMi ? 3 : 1.8} fill={renk} opacity={canliMi ? 0.95 : 0.45}
                style={{ transition: "r 300ms ease, opacity 300ms ease" }} />
              <title>{`${bayrakEmoji(n.ulke)} ${n.name}${canliMi ? ` — ${[n.nowPlaying!.artist, n.nowPlaying!.title].filter(Boolean).join(" — ")}` : ""} · dokun, çalsın`}</title>
            </g>
          );
        })}
      </svg>

      {/* Akış şeridi — satıra dokun, o radyo BURADA çalsın */}
      <div className="relative z-10 px-6 pb-5" style={{ minHeight: 120 }}>
        <p className="mono mb-2 text-[10px] uppercase tracking-[0.25em]" style={{ color: "#7a5c52" }}>
          şu an değişti — dokun, çalsın
        </p>
        <ul className="flex flex-col gap-1">
          {akis.length === 0 && (
            <li className="text-sm" style={{ color: "#8d6f63" }}>dünya dönüyor, ilk şarkı değişimi bekleniyor…</li>
          )}
          {akis.map((a) => {
            const buCaliyor = calan?.slug === a.slug;
            return (
              <li key={a.id} className="fade-in truncate text-sm">
                <button
                  onClick={() => cal(a.slug, a.name, a.ulke)}
                  className="press max-w-full truncate text-left hover:underline"
                  style={{ color: buCaliyor ? "#ff9b76" : "#e8d3c8" }}
                >
                  {buCaliyor ? "⏸" : "▶"} {bayrakEmoji(a.ulke)}{" "}
                  <span style={{ color: buCaliyor ? "#ff9b76" : "#f2e6da" }}>{a.metin}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <audio ref={sesRef} onPause={() => {}} />
    </div>
  );
}
