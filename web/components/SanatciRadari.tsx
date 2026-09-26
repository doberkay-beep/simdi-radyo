"use client";

import { useMemo, useState } from "react";
import { useDil } from "@/lib/i18n";
import { izlenenOku, izleniyorMu } from "@/lib/avlar";

// Sanatçı Radarı — izlemeye aldığın bir sanatçı herhangi bir istasyonda
// çalmaya başlayınca ana sayfada bant düşer. Push yok; site açıkken canlı çalışır.

type Ist = {
  slug: string;
  name: string;
  accentColor: string | null;
  nowPlaying: { artist: string | null; title: string | null } | null;
};

export default function SanatciRadari({ stations, onTune }: { stations: Ist[]; onTune: (slug: string) => void }) {
  const { t } = useDil();
  const [kapatilan, setKapatilan] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("radarKapatilan");
    } catch {
      return null;
    }
  });

  const bulunan = useMemo(() => {
    const izlenenler = izlenenOku();
    if (!izlenenler.length) return null;
    for (const s of stations) {
      if (s.nowPlaying?.artist && izleniyorMu(izlenenler, s.nowPlaying.artist)) {
        return { slug: s.slug, istasyon: s.name, accent: s.accentColor, artist: s.nowPlaying.artist, title: s.nowPlaying.title };
      }
    }
    return null;
  }, [stations]);

  if (!bulunan) return null;
  const kimlik = `${bulunan.artist}|${bulunan.title}|${bulunan.slug}`;
  if (kapatilan === kimlik) return null;

  return (
    <div
      className="mb-5 flex items-center gap-3 rounded-lg border px-4 py-3"
      style={{ borderColor: bulunan.accent || "var(--line)" }}
      role="status"
    >
      <span aria-hidden className="text-lg leading-none">🎣</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
          {t("av.radar")}
        </p>
        <p className="truncate text-sm" style={{ color: "var(--fg)" }}>
          <strong>{bulunan.artist}</strong> · {bulunan.istasyon}
          {bulunan.title ? ` — ${bulunan.title}` : ""}
        </p>
      </div>
      <button
        onClick={() => onTune(bulunan.slug)}
        className="press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold"
        style={{ background: bulunan.accent || "var(--fg)", color: "#0a0a0b" }}
      >
        {t("av.dinle")}
      </button>
      <button
        onClick={() => {
          setKapatilan(kimlik);
          try {
            sessionStorage.setItem("radarKapatilan", kimlik);
          } catch { /* yoksay */ }
        }}
        aria-label="kapat"
        className="press shrink-0 text-sm leading-none"
        style={{ color: "var(--muted)" }}
      >
        ×
      </button>
    </div>
  );
}
