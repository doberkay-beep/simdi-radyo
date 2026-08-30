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
export default function EmbedLive({ slug, name, accent }: { slug: string; name: string; accent: string }) {
  const [live, setLive] = useState<Live>(null);
  const ink = readableOn(accent);

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
    <a
      href={`https://necaliyor.co/radyo/${slug}`}
      target="_blank"
      rel="noopener"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        textDecoration: "none",
        width: "100%",
        boxSizing: "border-box",
        padding: "16px 18px",
        borderRadius: 16,
        background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 45%, #08080a))`,
        color: ink,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      {/* Ekolayzer */}
      <span style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 34 }}>
        {[16, 28, 22, 34, 20].map((h, i) => (
          <span key={i} style={{ width: 4, height: h, background: ink, opacity: 0.85, borderRadius: 2 }} />
        ))}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.75 }}>
          {name} · şu an
        </span>
        <span
          style={{
            display: "block",
            fontSize: 16,
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
      <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, whiteSpace: "nowrap" }}>necaliyor.co</span>
    </a>
  );
}
