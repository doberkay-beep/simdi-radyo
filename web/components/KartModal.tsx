"use client";

import { useEffect, useState } from "react";

type Fmt = "yatay" | "kare" | "story";

const FORMATS: { key: Fmt; ad: string; oran: string }[] = [
  { key: "yatay", ad: "yatay", oran: "16:9" },
  { key: "kare", ad: "kare", oran: "1:1" },
  { key: "story", ad: "story", oran: "9:16" },
];

// Paylaşılabilir kart önizleme penceresi — format seç, indir/kopyala/paylaş.
export default function KartModal({
  slug,
  name,
  accent,
  onClose,
}: {
  slug: string;
  name: string;
  accent: string;
  onClose: () => void;
}) {
  const [fmt, setFmt] = useState<Fmt>("yatay");
  const [durum, setDurum] = useState<"" | "kopyalandi" | "indi" | "yok">("");
  // Görsel her açılışta taze (o an çalanı yakala).
  const [stamp] = useState(() => Date.now());
  const src = `/api/kart/${slug}?format=${fmt}&t=${stamp}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function getBlob(): Promise<Blob> {
    const res = await fetch(src);
    if (!res.ok) throw new Error();
    return res.blob();
  }

  async function indir() {
    try {
      const blob = await getBlob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${slug}-${fmt}.png`;
      a.click();
      URL.revokeObjectURL(href);
      setDurum("indi");
      setTimeout(() => setDurum(""), 1600);
    } catch {
      setDurum("yok");
      setTimeout(() => setDurum(""), 1600);
    }
  }

  async function kopyala() {
    try {
      const blob = await getBlob();
      const CI = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
      if (navigator.clipboard && CI) {
        await navigator.clipboard.write([new CI({ "image/png": blob })]);
        setDurum("kopyalandi");
        setTimeout(() => setDurum(""), 1600);
      } else {
        await indir();
      }
    } catch {
      await indir();
    }
  }

  async function paylas() {
    try {
      const blob = await getBlob();
      const file = new File([blob], `${slug}-${fmt}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: `${name} — şimdi çalıyor · necaliyor.co` });
      } else {
        await indir();
      }
    } catch {
      // iptal
    }
  }

  const oran = fmt === "yatay" ? "1200 / 630" : fmt === "kare" ? "1 / 1" : "9 / 16";

  return (
    <div
      onClick={onClose}
      className="fade-in fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(4,4,6,0.82)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col rounded-2xl border p-5"
        style={{ borderColor: "var(--line)", background: "var(--bg)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="brand text-lg font-bold tracking-tight">kartı paylaş</span>
          <button
            onClick={onClose}
            aria-label="kapat"
            className="press text-xl leading-none"
            style={{ color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Önizleme */}
        <div
          className="mx-auto w-full overflow-hidden rounded-xl border"
          style={{
            borderColor: "var(--line)",
            aspectRatio: oran,
            maxHeight: fmt === "story" ? "56vh" : undefined,
            maxWidth: fmt === "story" ? "min(100%, 320px)" : undefined,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="kart önizleme" className="h-full w-full object-contain" />
        </div>

        {/* Format seçici */}
        <div className="mt-4 flex justify-center gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFmt(f.key)}
              className="press rounded-full border px-4 py-1.5 text-sm"
              style={{
                borderColor: fmt === f.key ? accent : "var(--line)",
                background: fmt === f.key ? "color-mix(in srgb, " + accent + " 16%, transparent)" : "transparent",
                color: fmt === f.key ? "var(--fg)" : "var(--muted)",
              }}
            >
              {f.ad} <span style={{ color: "var(--muted)" }}>{f.oran}</span>
            </button>
          ))}
        </div>

        {/* Eylemler */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={paylas}
            className="press flex-1 rounded-full px-4 py-2.5 text-sm font-semibold"
            style={{ background: accent, color: "#0a0a0b" }}
          >
            paylaş
          </button>
          <button
            onClick={indir}
            className="press flex-1 rounded-full border px-4 py-2.5 text-sm"
            style={{ borderColor: "var(--line)", color: "var(--fg)" }}
          >
            {durum === "indi" ? "indi ✓" : durum === "yok" ? "olmadı" : "indir"}
          </button>
          <button
            onClick={kopyala}
            className="press flex-1 rounded-full border px-4 py-2.5 text-sm"
            style={{ borderColor: "var(--line)", color: "var(--fg)" }}
          >
            {durum === "kopyalandi" ? "kopyalandı ✓" : "kopyala"}
          </button>
        </div>

        <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>
          o an çalan parçayla üretilir · Instagram için kare & story hazır
        </p>
      </div>
    </div>
  );
}
