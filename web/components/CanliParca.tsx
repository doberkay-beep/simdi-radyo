"use client";

import { useEffect, useRef, useState } from "react";

// "Şu an çalıyor" kutusu — sunucudan gelen ilk değeri (DB, revalidate) gösterir,
// sonra /api/live'ı CANLI yoklar: sayfa açılınca gerçek çalan parçaya anında
// senkron olur ve dinlerken güncel kalır. Canlı yoklama null dönerse son bilinen
// değeri korur (kutuyu boşaltmaz).
type Live = { artist: string | null; title: string | null; rawTitle: string | null } | null;

function metin(l: Live): string | null {
  if (!l) return null;
  const a = l.artist?.trim() || null;
  const t = l.title?.trim() || null;
  if (a && t && a !== t) return `${a} — ${t}`;
  return t || l.rawTitle?.trim() || null;
}

export default function CanliParca({
  slug,
  initial,
  etiket,
  bosMetin,
}: {
  slug: string;
  initial: string | null;
  etiket: string;
  bosMetin: string;
}) {
  const [track, setTrack] = useState<string | null>(initial);
  const [canli, setCanli] = useState(false);

  useEffect(() => {
    let off = false;
    const load = () =>
      fetch(`/api/live/${slug}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (off) return;
          const t = metin(d.live ?? null);
          if (t) {
            setTrack(t);
            setCanli(true);
          }
          // live null → son bilinen değeri koru (DB/önceki), boşaltma.
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    // Sekmeye geri dönünce anında tazele (kullanıcı geri geldiğinde senkron).
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      off = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [slug]);

  return (
    <div className="mt-8 rounded-xl border p-5" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {etiket}
        {canli && (
          <span className="inline-flex items-center gap-1" style={{ color: "#e0475f" }}>
            <span
              style={{ width: 6, height: 6, borderRadius: 999, background: "#e0475f", display: "inline-block" }}
            />
            canlı
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-semibold">{track ?? bosMetin}</div>
    </div>
  );
}
