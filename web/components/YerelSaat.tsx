"use client";

import { useEffect, useState } from "react";

/* Ülkenin yerel saati + gün durumu — "02:14 · gece" gibi. 30 sn'de tazelenir. */

const DURUM = {
  tr: ["gece", "sabah", "gündüz", "akşam"],
  en: ["night", "morning", "daytime", "evening"],
} as const;

function hesapla(tz: string, dil: "tr" | "en"): { saat: string; durum: string } {
  const simdi = new Date();
  const saat = new Intl.DateTimeFormat("tr-TR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(simdi);
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(simdi));
  const d = DURUM[dil];
  const durum = h < 6 ? d[0] : h < 11 ? d[1] : h < 17 ? d[2] : h < 22 ? d[3] : d[0];
  return { saat, durum };
}

export default function YerelSaat({ tz, dil = "tr" }: { tz: string; dil?: "tr" | "en" }) {
  const [v, setV] = useState<{ saat: string; durum: string } | null>(null);

  useEffect(() => {
    const guncelle = () => { try { setV(hesapla(tz, dil)); } catch { setV(null); } };
    guncelle();
    const id = setInterval(guncelle, 30000);
    return () => clearInterval(id);
  }, [tz, dil]);

  if (!v) return null;
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {v.saat} · {v.durum}
    </span>
  );
}
