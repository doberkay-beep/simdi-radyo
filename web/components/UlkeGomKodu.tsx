"use client";

import { useState } from "react";
import { ulkeSlug, type UlkeKodu } from "@/lib/ulkeler";

/* "Siteme ekle" — ülkenin canlı rozetini gömme kodu (backlink motoru). */
export default function UlkeGomKodu({ kod, baslik, dil }: { kod: UlkeKodu; baslik: string; dil: "tr" | "en" }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const en = dil === "en";
  const kodMetni = `<iframe src="https://necaliyor.co/embed/ulke/${ulkeSlug(kod)}" width="360" height="180" style="border:0;border-radius:16px;max-width:100%" title="${baslik} — ŞİMDİ" loading="lazy"></iframe>`;

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(kodMetni);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1600);
    } catch { /* yoksay */ }
  }

  return (
    <details className="mt-10">
      <summary className="cursor-pointer text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {en ? "add to your site" : "siteme ekle"}
      </summary>
      <p className="epigraf mt-3 text-sm">
        {en
          ? "A live badge showing what's playing in this country right now — paste it into your blog."
          : "Bu ülkede şu an çalanları gösteren canlı rozet — bloguna yapıştır, kendiliğinden akar."}
      </p>
      <pre
        className="mt-3 overflow-x-auto rounded-xl border p-3 text-xs leading-relaxed"
        style={{ borderColor: "var(--line)", color: "var(--muted)" }}
      >
        {kodMetni}
      </pre>
      <button
        onClick={kopyala}
        className="press mt-2 rounded-full border px-3 py-1 text-xs"
        style={{ borderColor: "var(--line)", color: "var(--fg)" }}
      >
        {kopyalandi ? (en ? "copied ✓" : "kopyalandı ✓") : (en ? "copy code" : "kodu kopyala")}
      </button>
    </details>
  );
}
