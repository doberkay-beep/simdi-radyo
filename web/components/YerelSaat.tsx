"use client";

import { useEffect, useState } from "react";

/* Ülkenin yerel saati + gün durumu — "02:14 · gece" gibi. 30 sn'de tazelenir. */

function hesapla(tz: string): { saat: string; durum: string } {
  const simdi = new Date();
  const saat = new Intl.DateTimeFormat("tr-TR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(simdi);
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(simdi));
  const durum = h < 6 ? "gece" : h < 11 ? "sabah" : h < 17 ? "gündüz" : h < 22 ? "akşam" : "gece";
  return { saat, durum };
}

export default function YerelSaat({ tz }: { tz: string }) {
  const [v, setV] = useState<{ saat: string; durum: string } | null>(null);

  useEffect(() => {
    const guncelle = () => { try { setV(hesapla(tz)); } catch { setV(null); } };
    guncelle();
    const id = setInterval(guncelle, 30000);
    return () => clearInterval(id);
  }, [tz]);

  if (!v) return null;
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {v.saat} · {v.durum}
    </span>
  );
}
