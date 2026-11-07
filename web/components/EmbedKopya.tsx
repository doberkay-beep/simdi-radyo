"use client";

import { useState } from "react";
import { embedKodu } from "@/lib/embed";
import { useDil } from "@/lib/i18n";

// "Siteme ekle" — istasyonun canlı rozetini gömme kodu + kopyala.
export default function EmbedKopya({ slug, name }: { slug: string; name: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const en = useDil().dil === "en";
  const kod = embedKodu(slug, name);

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
        {en ? "add to my site" : "siteme ekle"}
      </summary>
      <p className="epigraf mt-3 text-sm">
        {en ? `Put the ${name} badge on your site or blog. It shows what is playing, live.` : `${name} rozetini kendi sitene ya da bloguna koy. Şu an çalanı canlı gösterir.`}
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
        {kopyalandi ? (en ? "copied ✓" : "kopyalandı ✓") : en ? "copy code" : "kodu kopyala"}
      </button>
    </details>
  );
}
