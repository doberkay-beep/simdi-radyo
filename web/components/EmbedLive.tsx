"use client";

import { useEffect, useState } from "react";

type Live = { artist: string | null; title: string | null; rawTitle: string | null } | null;

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

// Gömülebilir "şu an çalıyor" rozeti — başka siteler iframe ile koyar.
// boy: kart 360×92 (varsayılan) · ince 468×60 · genis 728×90.
export default function EmbedLive({ slug, name, accent, boy: boyProp }: { slug: string; name: string; accent: string; boy?: "kart" | "ince" | "genis" }) {
  const [live, setLive] = useState<Live>(null);
  const [boy, setBoy] = useState<"kart" | "ince" | "genis">(boyProp ?? "kart");
  const ink = readableOn(accent);

  // Boy iframe URL'sinden gelir (?boy=ince|genis) — sayfa statik kalsın diye client'ta okunur.
  useEffect(() => {
    if (boyProp) return;
    try {
      const b = new URLSearchParams(window.location.search).get("boy");
      if (b === "ince" || b === "genis") setBoy(b);
    } catch { /* yoksay */ }
  }, [boyProp]);
  const B = {
    kart: { pad: "16px 18px", radius: 16, eq: 34, eqBars: [16, 28, 22, 34, 20], etiket: 11, parca: 16, gap: 14 },
    ince: { pad: "7px 14px", radius: 12, eq: 22, eqBars: [10, 18, 14, 22, 12], etiket: 9, parca: 13, gap: 10 },
    genis: { pad: "14px 20px", radius: 14, eq: 34, eqBars: [16, 28, 22, 34, 20], etiket: 11, parca: 17, gap: 14 },
  }[boy];

  useEffect(() => {
    let off = false;
    const load = () =>
      fetch(`/api/live/${slug}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !off && setLive(d.live ?? null))
        .catch(() => {});
    load();
    const id = setInterval(load, 20000);
    return () => {
      off = true;
      clearInterval(id);
    };
  }, [slug]);

  const track =
    live && live.artist && live.title && live.artist !== live.title
      ? `${live.artist} — ${live.title}`
      : live?.title || live?.rawTitle || "canlı yayın";

  return (
    <div style={{ padding: boy === "kart" ? 8 : 0, height: "100dvh", boxSizing: "border-box", background: "transparent" }}>
    <a
      href={`https://necaliyor.co/radyo/${slug}`}
      target="_blank"
      rel="noopener"
      style={{
        display: "flex",
        alignItems: "center",
        gap: B.gap,
        textDecoration: "none",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: B.pad,
        borderRadius: B.radius,
        background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 45%, #08080a))`,
        color: ink,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      {/* Ekolayzer */}
      <span style={{ display: "flex", alignItems: "flex-end", gap: 3, height: B.eq }}>
        {B.eqBars.map((h, i) => (
          <span key={i} style={{ width: 4, height: h, background: ink, opacity: 0.85, borderRadius: 2 }} />
        ))}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: B.etiket, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.75 }}>
          {name} · şu an
        </span>
        <span
          style={{
            display: "block",
            fontSize: B.parca,
            fontWeight: 700,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {track}
        </span>
      </span>
      <span style={{ fontSize: B.etiket, fontWeight: 700, opacity: 0.85, whiteSpace: "nowrap" }}>necaliyor.co</span>
    </a>
    </div>
  );
}
