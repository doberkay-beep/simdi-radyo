"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ULKELER, KOORDINAT, doluUlkeler, ulkeSlug, ulkeSlugEn, ulkeIstasyonSluglari, bayrakEmoji, type UlkeKodu } from "@/lib/ulkeler";

/* Dünya Haritası — kıtasız, ışıklı bir gece göğü gibi: enlem/boylam ızgarası,
   yaklaşık gece-gündüz gölgesi ve ülke işaret noktaları. Noktaya dokun → ülke sayfası.
   (Kıta çizimi yok; harita verisi taşımadan, tamamen üretilmiş bir görsel.) */

const W = 720;
const H = 360;

function xy(lat: number, lng: number): [number, number] {
  return [((lng + 180) / 360) * W, ((90 - lat) / 180) * H];
}

export default function DunyaHaritasi({ dil = "tr" }: { dil?: "tr" | "en" }) {
  const router = useRouter();
  const [gunesBoylami, setGunesBoylami] = useState<number | null>(null);

  useEffect(() => {
    const hesapla = () => {
      const s = new Date();
      const utc = s.getUTCHours() + s.getUTCMinutes() / 60;
      setGunesBoylami((12 - utc) * 15); // öğlen güneşinin altındaki boylam (yaklaşık)
    };
    hesapla();
    const id = setInterval(hesapla, 60000);
    return () => clearInterval(id);
  }, []);

  const noktalar = useMemo(
    () =>
      doluUlkeler()
        .filter((k) => KOORDINAT[k])
        .map((k) => {
          const [lat, lng] = KOORDINAT[k]!;
          const [x, y] = xy(lat, lng);
          return { k, x, y, n: ulkeIstasyonSluglari(k).length };
        }),
    []
  );

  // Gece maskesi: güneş boylamının 90° ötesinden itibaren karanlık (yumuşak kenar).
  const geceX = gunesBoylami === null ? null : ((((gunesBoylami + 180) % 360) + 360) % 360) / 360 * W;

  return (
    <div
      className="relative mb-8 overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--line)",
        background: "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--fg) 5%, transparent), transparent 60%), color-mix(in srgb, var(--bg) 90%, #000)",
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={dil === "en" ? "World map — countries with stations" : "Dünya haritası — istasyonlu ülkeler"}>
        {/* Izgara */}
        {Array.from({ length: 11 }, (_, i) => (i + 1) * 30).map((lng) => (
          <line key={`v${lng}`} x1={(lng / 360) * W} y1={0} x2={(lng / 360) * W} y2={H} stroke="currentColor" strokeOpacity={0.07} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (i + 1) * 30).map((lat) => (
          <line key={`h${lat}`} x1={0} y1={(lat / 180) * H} x2={W} y2={(lat / 180) * H} stroke="currentColor" strokeOpacity={0.07} />
        ))}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="currentColor" strokeOpacity={0.14} />

        {/* Gece gölgesi — güneşin karşı yarım küresi, iki parça (sarmal) */}
        {geceX !== null && (
          <g style={{ transition: "opacity 1s ease" }}>
            {(() => {
              const start = (geceX + W / 4) % W; // terminatör başlangıcı
              const parcalar: [number, number][] = [];
              const uz = W / 2;
              if (start + uz <= W) parcalar.push([start, uz]);
              else { parcalar.push([start, W - start]); parcalar.push([0, uz - (W - start)]); }
              return parcalar.map(([x, w], i) => (
                <rect key={i} x={x} y={0} width={w} height={H} fill="#000" opacity={0.42} />
              ));
            })()}
          </g>
        )}

        {/* Ülke noktaları */}
        {noktalar.map(({ k, x, y, n }) => {
          const r = 3 + Math.min(n, 20) / 7;
          return (
            <g
              key={k}
              onClick={() => router.push(dil === "en" ? `/en/country/${ulkeSlugEn(k)}` : `/ulke/${ulkeSlug(k)}`)}
              style={{ cursor: "pointer" }}
              role="link"
              tabIndex={0}
              aria-label={`${dil === "en" ? ULKELER[k].en : ULKELER[k].tr} — ${n}`}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(dil === "en" ? `/en/country/${ulkeSlugEn(k)}` : `/ulke/${ulkeSlug(k)}`); }}
            >
              <title>{`${bayrakEmoji(k)} ${dil === "en" ? ULKELER[k].en : ULKELER[k].tr} · ${n}`}</title>
              <circle cx={x} cy={y} r={r + 6} fill="#3ddc84" opacity={0.09} />
              <circle cx={x} cy={y} r={r} fill="#3ddc84" opacity={0.9}>
                <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" begin={`${(x / W) * 2}s`} />
              </circle>
              {/* dokunma alanı */}
              <circle cx={x} cy={y} r={12} fill="transparent" />
            </g>
          );
        })}
      </svg>
      <p className="absolute bottom-2 right-3 text-[10px]" style={{ color: "var(--muted)" }}>
        {dil === "en" ? "tap a light — night side is dark" : "bir ışığa dokun — karanlık taraf gece"}
      </p>
    </div>
  );
}
