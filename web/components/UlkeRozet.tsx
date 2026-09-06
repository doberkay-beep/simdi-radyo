"use client";

import { useEffect, useState } from "react";

/* Gömülebilir ülke rozeti — "bu ülkede şu an çalanlar" (iframe içi). */

const COP_PARCA = /use http|www\.|https?:|\.com|\.net\b/i;

type Satir = { slug: string; name: string; accentColor: string | null; parca: string };

export default function UlkeRozet({
  sluglar, baslikDa, bayrak, ulkeSlugu,
}: {
  sluglar: string[]; baslikDa: string; bayrak: string; ulkeSlugu: string;
}) {
  const [satirlar, setSatirlar] = useState<Satir[]>([]);

  useEffect(() => {
    let durdu = false;
    const set = new Set(sluglar);
    async function yukle() {
      try {
        const r = await fetch("/api/now", { cache: "no-store" });
        const d = await r.json();
        type ApiSt = { slug: string; name: string; accentColor: string | null; nowPlaying: { artist: string | null; title: string | null } | null };
        const canli: Satir[] = ((d.stations ?? []) as ApiSt[])
          .filter((s) => set.has(s.slug) && s.nowPlaying?.title && !COP_PARCA.test(s.nowPlaying.title))
          .slice(0, 3)
          .map((s) => ({
            slug: s.slug, name: s.name, accentColor: s.accentColor,
            parca: [s.nowPlaying!.artist, s.nowPlaying!.title].filter(Boolean).join(" — "),
          }));
        if (!durdu) setSatirlar(canli);
      } catch { /* sessiz */ }
    }
    yukle();
    const id = setInterval(yukle, 30000);
    return () => { durdu = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sluglar.join(",")]);

  return (
    <a
      href={`https://necaliyor.co/ulke/${ulkeSlugu}`}
      target="_top"
      style={{
        display: "block", fontFamily: "system-ui, sans-serif", background: "#050505",
        color: "#fafafa", borderRadius: 14, padding: "12px 14px", textDecoration: "none",
        border: "1px solid rgba(250,250,250,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{bayrak} {baslikDa} şu an</span>
        <span style={{ fontSize: 11, color: "#8f8f96" }}>ŞİMDİ →</span>
      </div>
      {satirlar.length === 0 ? (
        <div style={{ fontSize: 12, color: "#8f8f96" }}>canlı yayına bağlanılıyor…</div>
      ) : (
        satirlar.map((s) => (
          <div key={s.slug} style={{ padding: "4px 0", borderTop: "1px solid rgba(250,250,250,0.07)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.parca}</div>
            <div style={{ fontSize: 11, color: s.accentColor || "#8f8f96" }}>{s.name}</div>
          </div>
        ))
      )}
    </a>
  );
}
