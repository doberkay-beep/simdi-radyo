"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDil } from "@/lib/i18n";

// Ana sayfada kalp defteri şeridi — son bırakılan anılar yavaşça akar,
// her not istasyonunun sayfasına götürür. Not azsa şerit hiç görünmez.

type Not = { id: number; slug: string; not: string; kalp?: number };
type Ist = { slug: string; name: string; accentColor: string | null };

export default function DefterSeridi({ stations }: { stations: Ist[] }) {
  const { t } = useDil();
  const [notlar, setNotlar] = useState<Not[]>([]);

  useEffect(() => {
    let off = false;
    fetch("/api/not", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !off && setNotlar((d.notlar ?? []).slice(0, 14)))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  if (notlar.length < 3) return null;
  const bySlug = new Map(stations.map((s) => [s.slug, s]));
  const parcalar = notlar
    .map((n) => ({ ...n, ist: bySlug.get(n.slug) }))
    .filter((n) => n.ist);
  if (parcalar.length < 3) return null;

  return (
    <div className="mb-5 overflow-hidden" aria-label={t("defter.baslik")}>
      <style>{`
        @keyframes defter-ak { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .defter-serit { display: flex; width: max-content; gap: 2.25rem; animation: defter-ak 55s linear infinite; }
        .defter-serit:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .defter-serit { animation: none; } }
      `}</style>
      <p className="mb-1.5 text-[11px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        ♥ {t("defter.baslik")}
      </p>
      <div className="defter-serit text-sm">
        {[...parcalar, ...parcalar].map((n, i) => (
          <Link
            key={`${n.id}-${i}`}
            href={`/radyo/${n.slug}`}
            className="shrink-0 whitespace-nowrap"
            style={{ color: "var(--muted)" }}
          >
            <span className="italic" style={{ color: "var(--fg)" }}>“{n.not}”</span>
            <span style={{ color: n.ist!.accentColor || "var(--fg)" }}> — {n.ist!.name}</span>
            {(n.kalp || 0) > 1 ? <span> ♥{n.kalp}</span> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
