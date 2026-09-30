"use client";

import { useEffect } from "react";
import { kasaAcilis, kasaYedekle } from "@/lib/kasa";

// Görünmez bekçi: her sayfada açılışta kasayı kontrol eder, defterler
// değiştikçe (20 sn'de bir ve sekme arka plana geçerken) sessizce yedekler.
// İçerik aynıysa ağa hiç çıkmaz.
export default function KasaBekcisi() {
  useEffect(() => {
    kasaAcilis().catch(() => {});
    const iv = setInterval(() => { kasaYedekle().catch(() => {}); }, 20000);
    const gizlenince = () => {
      if (document.visibilityState === "hidden") kasaYedekle().catch(() => {});
    };
    document.addEventListener("visibilitychange", gizlenince);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", gizlenince);
    };
  }, []);
  return null;
}
