"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { KOORDINAT, ULKELER, bayrakEmoji, istasyonUlkesi, type UlkeKodu } from "@/lib/ulkeler";
import { simdiDinle } from "@/lib/canli";
import { temizMetin } from "@/lib/cop";

/* CANLI HARİTA — imparatorluğun vitrini: dünya bir gece göğü, her istasyon
   bir ışık. Bir istasyonda şarkı değiştiği AN noktası parlar ve alttaki
   akış şeridine düşer. Tam ekran/TV-arkası/embed dostu (?embed=1). */

const W = 1440;
const H = 720;

function xy(lat: number, lng: number): [number, number] {
  return [((lng + 180) / 360) * W, ((90 - lat) / 180) * H];
}

/* Slug'dan deterministik saçılım — aynı ülkenin istasyonları başkent
   çevresine yıldız kümesi gibi dağılır (her yüklemede aynı yerde). */
function sacilim(slug: string): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) { h ^= slug.charCodeAt(i); h = Math.imul(h, 16777619); }
  const a = ((h >>> 0) % 1000) / 1000;
  const b = ((h >>> 10) % 1000) / 1000;
  return [(a - 0.5) * 7, (b - 0.5) * 4.5]; // ±3.5° boylam, ±2.25° enlem
}

type Ist = {
  id: number; slug: string; name: string; accentColor: string | null;
  nowPlaying: { artist: string | null; title: string | null } | null;
};
type Nokta = Ist & { x: number; y: number; ulke: UlkeKodu };
type Akis = { id: number; zaman: number; metin: string; ulke: UlkeKodu; slug: string };

export default function CanliHarita({ embed = false }: { embed?: boolean }) {
  const [noktalar, setNoktalar] = useState<Nokta[]>([]);
  const [tazeler, setTazeler] = useState<Record<number, number>>({});
  const [akis, setAkis] = useState<Akis[]>([]);
  const [gunesBoylami, setGunesBoylami] = useState(0);
  const kokRef = useRef<HTMLDivElement | null>(null);
  const noktaRef = useRef<Map<number, Nokta>>(new Map());

  useEffect(() => {
    const hesapla = () => {
      const s = new Date();
      setGunesBoylami((12 - (s.getUTCHours() + s.getUTCMinutes() / 60)) * 15);
    };
    hesapla();
    const id = setInterval(hesapla, 60000);
    return () => clearInterval(id);
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

    // Şarkı değişimleri: nokta parlar + akış şeridine düşer.
    const ayril = simdiDinle((deg) => {
      const n = noktaRef.current.get(deg.station_id);
      if (!n) return;
      setTazeler((t) => ({ ...t, [deg.station_id]: Date.now() }));
      setTimeout(() => {
        setTazeler((t) => { const y = { ...t }; delete y[deg.station_id]; return y; });
      }, 5000);
      const artist = temizMetin(deg.artist);
      const title = temizMetin(deg.title);
      if (!artist && !title) return;
      if (`${artist}${title}`.includes("~")) return; // ham metadata sızıntısı şeride girmesin
      setAkis((a) => [
        { id: Date.now() + deg.station_id, zaman: Date.now(), metin: `${n.name}: ${[artist, title].filter(Boolean).join(" — ")}`, ulke: n.ulke, slug: n.slug },
        ...a,
      ].slice(0, 7));
    });
    return ayril;
  }, []);

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
      {/* Üst şerit — embed'de gizli */}
      {!embed && (
        <header className="relative z-10 flex items-center justify-between px-6 py-4">
          <Link href="/" className="brand text-xl font-bold tracking-tight" style={{ color: "#f2e6da" }}>
            ŞİMDİ <span style={{ color: "#8d6f63" }}>· canlı harita</span>
          </Link>
          <span className="mono flex items-center gap-4 text-[11px] uppercase tracking-[0.18em]" style={{ color: "#b0938a" }}>
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

      {/* Gök haritası */}
      <svg viewBox={`0 0 ${W} ${H}`} className="min-h-0 w-full flex-1" preserveAspectRatio="xMidYMid meet" role="img" aria-label="dünyada şu an çalan radyolar">
        {/* Izgara */}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`b${i}`} x1={(i + 1) * (W / 12)} y1={0} x2={(i + 1) * (W / 12)} y2={H} stroke="#1c0f14" strokeWidth={1} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`e${i}`} x1={0} y1={(i + 1) * (H / 6)} x2={W} y2={(i + 1) * (H / 6)} stroke="#1c0f14" strokeWidth={1} />
        ))}
        {/* Gece örtüsü — güneşin öteki yüzü */}
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
        <rect x={((geceX + W / 2) % W) - W} y={0} width={W} height={H} fill="url(#gece)" />
        <rect x={(geceX + W / 2) % W} y={0} width={W} height={H} fill="url(#gece)" />

        {/* İstasyon ışıkları */}
        {noktalar.map((n) => {
          const renk = n.accentColor || "#ff9b76";
          const canli = !!(n.nowPlaying && (n.nowPlaying.artist || n.nowPlaying.title));
          const taze = !!tazeler[n.id];
          return (
            <Link key={n.slug} href={`/?ist=${n.slug}`}>
              <g className="cursor-pointer">
                {taze && <circle cx={n.x} cy={n.y} r={16} fill="url(#parla)" opacity={0.7} />}
                <circle cx={n.x} cy={n.y} r={taze ? 5 : canli ? 3 : 1.8} fill={renk} opacity={canli ? 0.95 : 0.4}
                  style={{ transition: "r 300ms ease, opacity 300ms ease" }} />
                <title>{`${bayrakEmoji(n.ulke)} ${n.name}${canli ? ` — ${[n.nowPlaying!.artist, n.nowPlaying!.title].filter(Boolean).join(" — ")}` : ""}`}</title>
              </g>
            </Link>
          );
        })}
      </svg>

      {/* Akış şeridi — şu an değişenler */}
      <div className="relative z-10 px-6 pb-5" style={{ minHeight: 120 }}>
        <p className="mono mb-2 text-[10px] uppercase tracking-[0.25em]" style={{ color: "#7a5c52" }}>
          şu an değişti
        </p>
        <ul className="flex flex-col gap-1">
          {akis.length === 0 && (
            <li className="text-sm" style={{ color: "#8d6f63" }}>dünya dönüyor, ilk şarkı değişimi bekleniyor…</li>
          )}
          {akis.map((a) => (
            <li key={a.id} className="fade-in truncate text-sm" style={{ color: "#e8d3c8" }}>
              <Link href={`/?ist=${a.slug}`} className="hover:underline">
                {bayrakEmoji(a.ulke)} <span style={{ color: "#f2e6da" }}>{a.metin}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
