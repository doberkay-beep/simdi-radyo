"use client";

import { useDil } from "@/lib/i18n";
import { guncelSecki } from "@/lib/sairin-frekansi";

// Şairin Frekansı — Berkay'ın istasyon seçkisi köşesi. Seçki yoksa görünmez.

type Ist = { slug: string; name: string; accentColor: string | null };

export default function SairinFrekansi({ stations, onTune }: { stations: Ist[]; onTune: (slug: string) => void }) {
  const { t } = useDil();
  const secki = guncelSecki();
  if (!secki) return null;
  const ist = stations.find((s) => s.slug === secki.slug);
  if (!ist) return null;

  return (
    <div
      className="mb-5 rounded-lg border px-4 py-3"
      style={{ borderColor: "var(--line)" }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: ist.accentColor || "var(--fg)" }}>
        ❋ {t("sair.baslik")}
      </p>
      <p className="epigraf mt-1 text-[15px]">“{secki.not}”</p>
      <button
        onClick={() => onTune(ist.slug)}
        className="press mt-2 rounded-full px-3.5 py-1.5 text-xs font-semibold"
        style={{ background: ist.accentColor || "var(--fg)", color: "#0a0a0b" }}
      >
        {ist.name} — {t("av.dinle")}
      </button>
    </div>
  );
}
