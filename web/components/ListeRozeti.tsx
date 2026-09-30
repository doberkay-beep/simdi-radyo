"use client";

import { useState } from "react";

/* Rozet sayfası bölümü: ŞİMDİ LİSTESİ rozetini göm — önizleme + kopyala. */
export default function ListeRozeti() {
  const [boy, setBoy] = useState<"kart" | "genis">("kart");
  const [kopyalandi, setKopyalandi] = useState(false);

  const [w, h] = boy === "genis" ? [728, 90] : [300, 250];
  const kod = `<iframe src="https://necaliyor.co/embed/liste${boy === "genis" ? "?boy=genis" : ""}" width="${w}" height="${h}" frameborder="0" scrolling="no" title="ŞİMDİ LİSTESİ — Türkiye radyolarında bu hafta" loading="lazy"></iframe>`;

  function kopyala() {
    navigator.clipboard?.writeText(kod).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="mt-12 border-t pt-8" style={{ borderColor: "var(--line)" }}>
      <h2 className="brand text-2xl font-bold tracking-tight">
        🏆 ŞİMDİ LİSTESİ <span className="text-base font-normal" style={{ color: "var(--muted)" }}>· haftanın 5&apos;i, sitene</span>
      </h2>
      <p className="read mt-2 text-[15px]" style={{ color: "var(--muted)" }}>
        Türkiye radyolarında bu hafta gerçekte en çok çalanlar — canlı sayım, kendi kendine güncellenir.
      </p>
      <div className="mt-4 flex gap-2">
        {(["kart", "genis"] as const).map((b) => (
          <button
            key={b}
            onClick={() => setBoy(b)}
            className={`press text-xs ${boy === b ? "hap-dolu" : "hap"}`}
            style={{ padding: "7px 14px" }}
          >
            {b === "kart" ? "kart · 300×250" : "geniş · 728×90"}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        <iframe
          src={`/embed/liste${boy === "genis" ? "?boy=genis" : ""}`}
          width={w}
          height={h}
          style={{ border: 0 }}
          scrolling="no"
          title="önizleme"
        />
      </div>
      <pre className="mono mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border p-3 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        {kod}
      </pre>
      <button onClick={kopyala} className="press hap-marka mt-3 text-xs">
        {kopyalandi ? "kopyalandı ✓" : "kodu kopyala"}
      </button>
    </div>
  );
}
