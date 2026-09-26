"use client";

import { useEffect, useState } from "react";
import { useDil } from "@/lib/i18n";
import { nobetIsaretle } from "@/lib/rozet";

// GECE NÖBETİ — 02:00–05:00 arası site başka bir yüze bürünür:
// üstte nöbet bandı, sayfaya loş bir gece tülü, dakikada bir dönen nöbet cümlesi.
// Test için: ?nobet=1

const CUMLELER: { tr: string; en: string }[] = [
  { tr: "Uyuyamayanlar frekansı açık.", en: "The insomniacs' frequency is on." },
  { tr: "Şehir uyudu; kadran uyanık.", en: "The city sleeps; the dial is awake." },
  { tr: "Bu saatte her şarkı bir sır gibi çalar.", en: "At this hour every song plays like a secret." },
  { tr: "Nöbeti devralan: sen.", en: "Now on watch: you." },
  { tr: "Gece, sesin en iyi taşındığı sudur.", en: "Night is the water sound travels best in." },
];

export default function GeceNobeti() {
  const { dil } = useDil();
  const [aktif, setAktif] = useState(false);
  const [dk, setDk] = useState(0);

  useEffect(() => {
    const kontrol = () => {
      const h = new Date().getHours();
      let zorla = false;
      try {
        zorla = new URLSearchParams(window.location.search).get("nobet") === "1";
      } catch { /* yoksay */ }
      setAktif(zorla || (h >= 2 && h < 5));
      setDk(Math.floor(Date.now() / 60000));
    };
    kontrol();
    const t = setInterval(kontrol, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!aktif) return;
    {
      // rozet: gece nöbetçisi — yalnız gerçek nöbet saatinde sayılır (?nobet=1 testi sayılmaz)
      const h = new Date().getHours();
      if (h >= 2 && h < 5) nobetIsaretle();
    }
    const eski = document.title;
    if (!eski.startsWith("🌙")) document.title = `🌙 ${eski}`;
    return () => {
      document.title = document.title.replace(/^🌙 /, "");
    };
  }, [aktif]);

  if (!aktif) return null;
  const c = CUMLELER[dk % CUMLELER.length];

  return (
    <>
      {/* gece tülü — tıklamayı engellemez, temayı bozmaz */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{ background: "radial-gradient(120% 100% at 50% 0%, transparent 52%, rgba(2,2,12,0.38))" }}
      />
      <div
        className="mb-5 flex items-center gap-3 rounded-lg border px-4 py-3"
        style={{ borderColor: "var(--line)", background: "linear-gradient(135deg, rgba(30,30,60,0.25), transparent)" }}
      >
        <span aria-hidden className="text-lg leading-none">🌙</span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--fg)" }}>
            {dil === "en" ? "night watch" : "gece nöbeti"} · 02–05
          </p>
          <p className="epigraf mt-0.5 text-sm" key={c.tr}>
            {dil === "en" ? c.en : c.tr}
          </p>
        </div>
      </div>
    </>
  );
}
