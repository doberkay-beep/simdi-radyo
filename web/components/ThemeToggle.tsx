"use client";

import { useEffect, useState } from "react";

// Açık/kapalı tema düğmesi. Seçim localStorage'da 'tema' altında hatırlanır.
// İlk yükleme flaş'ını layout'taki inline script önler.
export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme !== "light");
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("tema", next);
    } catch {
      // özel mod vb. — sorun değil
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Açık temaya geç" : "Karanlık temaya geç"}
      className="text-base leading-none"
      style={{ color: "var(--muted)" }}
    >
      {dark ? "☀︎" : "☾"}
    </button>
  );
}
