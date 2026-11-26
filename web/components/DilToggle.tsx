"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dilYaz, tarayiciYereli, yerelOku } from "@/lib/i18n";

// TR ↔ ziyaretçinin dili (tarayıcısı Türkçe değilse o dil, yoksa EN) değiştirici. İstemci parçaları olayla, sunucuda çizilen metinler
// (dil çerezini okuyan sayfalar) router.refresh() ile anında yeni dile geçer.
export default function DilToggle() {
  const router = useRouter();
  const [dil, setDil] = useState<string>("tr");
  const [obur, setObur] = useState<string>("en");
  useEffect(() => {
    setDil(yerelOku());
    setObur(tarayiciYereli());
  }, []);

  function degistir() {
    const yeni = dil === "tr" ? obur : "tr";
    setDil(yeni);
    dilYaz(yeni);
    router.refresh();
  }

  return (
    <button
      onClick={degistir}
      aria-label="dil değiştir"
      title={dil === "tr" ? (obur === "en" ? "switch to English" : obur) : "Türkçe'ye geç"}
      className="press rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{ borderColor: "var(--line)", color: "var(--muted)" }}
    >
      {dil === "tr" ? obur.slice(0, 2).toUpperCase() : "TR"}
    </button>
  );
}
