"use client";

import { useEffect, useState } from "react";

type Pref = "system" | "light" | "dark";

// Uygular: seçim 'light'/'dark' ise onu, 'system' ise cihaz tercihini kullanır.
// Mevcut CSS koyu-varsayılan + [data-theme="light"] olduğundan, açık istendiğinde
// data-theme=light konur, koyu istendiğinde kaldırılır.
function apply(pref: Pref) {
  const root = document.documentElement;
  const light =
    pref === "light" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
  if (light) root.dataset.theme = "light";
  else delete root.dataset.theme;
}

const ICON: Record<Pref, string> = { system: "🖥", light: "☀︎", dark: "☾" };
const LABEL: Record<Pref, string> = { system: "sistem teması", light: "açık tema", dark: "koyu tema" };

export default function ThemeToggle() {
  const [pref, setPref] = useState<Pref>("system");

  useEffect(() => {
    let p: Pref = "system";
    try {
      const v = localStorage.getItem("tema") as Pref | null;
      if (v === "light" || v === "dark" || v === "system") p = v;
    } catch {
      // yok say
    }
    setPref(p);
    apply(p);
  }, []);

  // Sistem modunda cihaz teması değişince yansıt.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  function cycle() {
    const next: Pref = pref === "system" ? "light" : pref === "light" ? "dark" : "system";
    setPref(next);
    apply(next);
    try {
      localStorage.setItem("tema", next);
    } catch {
      // yok say
    }
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Tema: ${LABEL[pref]} (değiştir)`}
      title={LABEL[pref]}
      className="press text-base leading-none"
      style={{ color: "var(--muted)" }}
    >
      {ICON[pref]}
    </button>
  );
}
