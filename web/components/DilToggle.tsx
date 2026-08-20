"use client";

import { useEffect, useState } from "react";
import { dilOku, dilYaz, type Dil } from "@/lib/i18n";

// TR / EN dil değiştirici. Yalnızca arayüzü çevirir.
export default function DilToggle() {
  const [dil, setDil] = useState<Dil>("tr");
  useEffect(() => setDil(dilOku()), []);

  function degistir() {
    const yeni: Dil = dil === "tr" ? "en" : "tr";
    setDil(yeni);
    dilYaz(yeni);
  }

  return (
    <button
      onClick={degistir}
      aria-label="dil değiştir"
      title={dil === "tr" ? "switch to English" : "Türkçe'ye geç"}
      className="press rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{ borderColor: "var(--line)", color: "var(--muted)" }}
    >
      {dil === "tr" ? "EN" : "TR"}
    </button>
  );
}
