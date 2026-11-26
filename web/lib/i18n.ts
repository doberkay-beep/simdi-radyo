"use client";

import { useEffect, useState } from "react";
import { ceviri, sozlukYukle, tabanDil, yerelGecerli, yerelSec, type Dil } from "./i18n-core";

// Sunucu+istemci ortak parçalar i18n-core'da; burada yalnızca istemci hook'ları.
export { ceviri, turAdi, SOZLUK, tabanDil, yerelSec, type Dil } from "./i18n-core";

const OLAY = "dildegisti";

/** Yerel dil kodu: seçim yapılmışsa o, yoksa tarayıcının dil listesinden desteklenen ilk dil. */
export function yerelOku(): string {
  if (typeof window === "undefined") return "tr";
  try {
    const s = localStorage.getItem("dil");
    if (yerelGecerli(s)) return s;
    const liste = navigator.languages?.length ? navigator.languages : [navigator.language || "tr"];
    return yerelSec(liste);
  } catch {
    return "tr";
  }
}

/** Tarayıcının kendi dili (Türkçe değilse): TR'den dönüşte bu dile geçilir. */
export function tarayiciYereli(): string {
  try {
    const liste = navigator.languages?.length ? navigator.languages : [navigator.language || "en"];
    const y = yerelSec(liste);
    return y === "tr" ? "en" : y;
  } catch {
    return "en";
  }
}

// Taban dil (tr/en): satır içi ayrımlar bunu kullanır.
export function dilOku(): Dil {
  return tabanDil(yerelOku());
}

export function dilYaz(d: string) {
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
  const [yerel, setYerel] = useState<string>("tr");
  const [, setSurum] = useState(0);
  useEffect(() => {
    const on = () => {
      const y = yerelOku();
      setYerel(y);
      sozlukYukle(y).then(() => setSurum((n) => n + 1));
    };
    on();
    window.addEventListener(OLAY, on);
    return () => window.removeEventListener(OLAY, on);
  }, []);
  return { dil: tabanDil(yerel), yerel, t: (anahtar: string) => ceviri(yerel, anahtar) };
}
