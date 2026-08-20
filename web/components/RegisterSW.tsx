"use client";

import { useEffect } from "react";

// Servis çalışanını kaydeder (PWA çevrimdışı kabuk). Sessizce başarısız olur.
export default function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const reg = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") reg();
    else {
      window.addEventListener("load", reg, { once: true });
      return () => window.removeEventListener("load", reg);
    }
  }, []);
  return null;
}
