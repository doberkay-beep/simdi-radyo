"use client";

import { useEffect, useState } from "react";
import { ceviri, type Dil } from "./i18n-core";

// Sunucu+istemci ortak parçalar i18n-core'da; burada yalnızca istemci hook'ları.
export { ceviri, turAdi, SOZLUK, type Dil } from "./i18n-core";

const OLAY = "dildegisti";

export function dilOku(): Dil {
  if (typeof window === "undefined") return "tr";
  try {
    return localStorage.getItem("dil") === "en" ? "en" : "tr";
  } catch {
    return "tr";
  }
}

export function dilYaz(d: Dil) {
  try {
    localStorage.setItem("dil", d);
  } catch {
    // yoksay
  }
  try {
    // Sunucu bileşenleri de okuyabilsin diye çerez.
    document.cookie = `dil=${d}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = d;
  } catch {
    // yoksay
  }
  window.dispatchEvent(new CustomEvent(OLAY, { detail: d }));
}

// Bileşenlerde: mevcut dil + t() çeviri fonksiyonu. Canlı değişime abone.
export function useDil() {
  const [dil, setDil] = useState<Dil>("tr");
  useEffect(() => {
    setDil(dilOku());
    const on = () => setDil(dilOku());
    window.addEventListener(OLAY, on);
    return () => window.removeEventListener(OLAY, on);
  }, []);
  return { dil, t: (anahtar: string) => ceviri(dil, anahtar) };
}
