"use client";

import { useEffect, useState } from "react";

// KADRAN ton seçici — kadranın şasi rengini (arka plan + parıltı) değiştirir.
// Magma varsayılan; seçim data-tone olarak köke yazılır, localStorage'da tutulur.
type Ton = "magma" | "radyum" | "tungsten" | "kobalt" | "ametist" | "siyah" | "beyaz";

const TONLAR: { id: Ton; renk: string; ad: string }[] = [
  { id: "magma", renk: "#ff6a3d", ad: "magma" },
  { id: "radyum", renk: "#37d67a", ad: "radyum" },
  { id: "tungsten", renk: "#e9a13a", ad: "tungsten" },
  { id: "kobalt", renk: "#5b8cff", ad: "kobalt" },
  { id: "ametist", renk: "#b17cff", ad: "ametist" },
  { id: "siyah", renk: "#26262b", ad: "siyah" },
  { id: "beyaz", renk: "#f2f2f4", ad: "beyaz" },
];

function apply(t: Ton) {
  const root = document.documentElement;
  if (t === "magma") delete root.dataset.tone;
  else root.dataset.tone = t;
}

export default function ToneToggle() {
  const [ton, setTon] = useState<Ton>("magma");
  const [acik, setAcik] = useState(false); // katlanır: kapalıyken tek top

  useEffect(() => {
    let t: Ton | null = null;
    try {
      const v = localStorage.getItem("ton") as Ton | null;
      if (v && TONLAR.some((x) => x.id === v)) t = v;
    } catch {
      // yok say
    }
    // Elle seçim yoksa gece (00–07) kadran kendiliğinden siyaha kayar;
    // localStorage'a yazılmaz, sabah magma'ya döner.
    const saat = new Date().getHours();
    const secim = t ?? (saat < 7 ? "siyah" : "magma");
    setTon(secim);
    apply(secim);
  }, []);

  function sec(t: Ton) {
    setTon(t);
    apply(t);
    setAcik(false);
    try {
      localStorage.setItem("ton", t);
    } catch {
      // yok say
    }
  }

  const aktif = TONLAR.find((x) => x.id === ton) ?? TONLAR[0];

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        aria-label={`ton: ${aktif.ad} (değiştir)`}
        title={`ton: ${aktif.ad}`}
        className="press rounded-full align-middle"
        style={{
          width: 14,
          height: 14,
          background: aktif.renk,
          boxShadow: `0 0 0 2px var(--bg), 0 0 0 3.5px ${aktif.renk}`,
        }}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 align-middle" role="group" aria-label="ton (arka plan rengi)">
      {TONLAR.map((x) => (
        <button
          key={x.id}
          onClick={() => sec(x.id)}
          aria-label={`ton: ${x.ad}`}
          aria-pressed={ton === x.id}
          title={x.ad}
          className="press rounded-full"
          style={{
            width: 14,
            height: 14,
            background: x.renk,
            boxShadow: ton === x.id ? `0 0 0 2px var(--bg), 0 0 0 3.5px ${x.renk}` : "inset 0 0 0 1px color-mix(in srgb, #000 25%, transparent)",
          }}
        />
      ))}
    </span>
  );
}
