"use client";

import { useState } from "react";

// "Siteme ekle" — istasyonun canlı rozetini gömme kodu + kopyala.
export default function EmbedKopya({ slug, name }: { slug: string; name: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const kod = `<iframe src="https://necaliyor.co/embed/${slug}" width="360" height="92" style="border:0;border-radius:16px;max-width:100%" title="${name} — şu an ne çalıyor" loading="lazy"></iframe>`;

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(kod);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1600);
    } catch {
      // yoksay
    }
  }

  return (
    <details className="mt-10">
      <summary className="cursor-pointer text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        siteme ekle
      </summary>
      <p className="epigraf mt-3 text-sm">
        {name} rozetini kendi sitene/blog&apos;una koy — şu an çalanı canlı gösterir.
      </p>
      <pre
        className="mt-3 overflow-x-auto rounded-md border p-3 text-xs"
        style={{ borderColor: "var(--line)", color: "var(--muted)" }}
      >
        <code>{kod}</code>
      </pre>
      <button
        onClick={kopyala}
        className="press mt-2 rounded-md border px-4 py-1.5 text-sm"
        style={{ borderColor: "var(--line)", color: "var(--fg)" }}
      >
        {kopyalandi ? "kopyalandı ✓" : "kodu kopyala"}
      </button>
    </details>
  );
}
