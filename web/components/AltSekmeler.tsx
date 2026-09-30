"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDil } from "@/lib/i18n";

// Mobil alt sekme çubuğu — telefonda uygulama hissi: ŞİMDİ · LİSTE · OYUN · FAL.
// Yalnız dar ekranda görünür; gömme (/embed) sayfalarına karışmaz.
export default function AltSekmeler() {
  const yol = usePathname();
  const { dil } = useDil();
  const en = dil === "en";
  if (yol?.startsWith("/embed")) return null;

  const SEKMELER = [
    { href: "/", emoji: "📻", tr: "ŞİMDİ", en: "NOW" },
    { href: "/liste", emoji: "🏆", tr: "LİSTE", en: "CHART" },
    { href: "/oyun", emoji: "🎮", tr: "OYUN", en: "PLAY" },
    { href: "/fal", emoji: "🔮", tr: "FAL", en: "FORTUNE" },
  ];
  const aktifMi = (href: string) => (href === "/" ? yol === "/" : yol?.startsWith(href));

  return (
    <>
      {/* Akış içi boşluk — çubuk içeriğin son satırını örtmesin. */}
      <div className="sm:hidden" style={{ height: "calc(64px + env(safe-area-inset-bottom))" }} aria-hidden />
      <nav
        className="alt-sekme fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t sm:hidden"
        style={{
          background: "color-mix(in srgb, var(--panel) 92%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "var(--line-hi)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label={en ? "bottom navigation" : "alt gezinme"}
      >
        {SEKMELER.map((s) => {
          const on = aktifMi(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={on ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 py-2.5"
              style={{ color: on ? "var(--glow-hi)" : "var(--muted)" }}
            >
              <span className="text-lg leading-none" aria-hidden>{s.emoji}</span>
              <span className="mono text-[9px] font-bold tracking-[0.14em]">{en ? s.en : s.tr}</span>
              <span
                aria-hidden
                className="h-[2px] w-6 rounded-full"
                style={{ background: on ? "var(--glow)" : "transparent" }}
              />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
