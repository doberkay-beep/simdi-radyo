"use client";

import { useState } from "react";

// "Siteme ekle" — istasyonun canlı rozetini gömme kodu + kopyala.
export default function EmbedKopya({ slug, name }: { slug: string; name: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  // iframe + DIŞINDA gerçek, crawlanabilir <a> linki: iframe-içi link backlink
  // saymaz; asıl SEO değeri bu görünür künyeden gelir.
  const kod = `<div style="max-width:360px">
  <iframe src="https://necaliyor.co/embed/${slug}" width="360" height="92" style="border:0;border-radius:16px;max-width:100%" title="${name} — şu an ne çalıyor" loading="lazy"></iframe>
  <p style="font:12px/1.4 system-ui,sans-serif;margin:6px 2px 0;color:#888">
    <a href="https://necaliyor.co/radyo/${slug}" style="color:inherit">${name} şu an ne çalıyor</a> · <a href="https://necaliyor.co" style="color:inherit">necaliyor.co</a>
  </p>
</div>`;

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
