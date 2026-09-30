"use client";

import { useEffect, useState } from "react";

// ⬆ YUKARI ÇIK — uzun istasyon listesinde bir ekran boyu aşağı inince belirir;
// oynatıcı çubuğunun üstünde durur, dokununca yumuşakça başa döner.
export default function YukariCik({ oynaticiVar }: { oynaticiVar: boolean }) {
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    const bak = () => setGorunur(window.scrollY > window.innerHeight * 1.5);
    bak();
    window.addEventListener("scroll", bak, { passive: true });
    return () => window.removeEventListener("scroll", bak);
  }, []);

  return (
    <button
      onClick={() => {
        const bas = window.scrollY;
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Yumuşak kaydırma bazı tarayıcılarda (düşük güç modu, arka plan) hiç
        // başlamaz — 250 ms'de kıpırdamadıysa anında başa atla.
        setTimeout(() => {
          if (window.scrollY >= bas - 2) window.scrollTo({ top: 0, behavior: "instant" });
        }, 250);
      }}
      aria-label="yukarı çık"
      title="yukarı çık"
      className="yukari-cik press"
      data-gorunur={gorunur ? "1" : "0"}
      style={{ bottom: oynaticiVar ? "calc(env(safe-area-inset-bottom) + 92px)" : "calc(env(safe-area-inset-bottom) + 20px)" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
      </svg>
    </button>
  );
}
