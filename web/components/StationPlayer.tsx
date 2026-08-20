"use client";

import { useEffect, useRef, useState } from "react";

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

// İstasyon sayfasında gerçek çalan mini oynatıcı (kendi <audio>'su).
export default function StationPlayer({
  slug,
  accent,
}: {
  slug: string;
  name?: string;
  accent: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<"idle" | "connecting" | "playing" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [kart, setKart] = useState<"idle" | "hazir" | "yok">("idle");
  const retries = useRef(0);

  useEffect(() => {
    const a = audioRef.current;
    return () => {
      a?.pause();
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (phase === "playing" || phase === "connecting") {
      a.pause();
      setPhase("idle");
      return;
    }
    retries.current = 0;
    setPhase("connecting");
    a.src = `/api/stream/${slug}`;
    a.play().catch(() => setPhase("error"));
  }

  function reconnect() {
    const a = audioRef.current;
    if (!a || phase === "idle") return;
    if (retries.current >= 6) {
      setPhase("error");
      return;
    }
    retries.current += 1;
    setPhase("connecting");
    setTimeout(() => {
      a.src = `/api/stream/${slug}?r=${Date.now()}`;
      a.play().catch(() => {});
    }, 800);
  }

  async function share() {
    const url = `https://necaliyor.co/radyo/${slug}`;
    try {
      if (navigator.share) await navigator.share({ url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      // iptal edildi
    }
  }

  // O anki çalan parçanın kartını üret → paylaş (görsel) ya da indir.
  async function paylasKart() {
    setKart("idle");
    try {
      const res = await fetch(`/api/kart/${slug}?t=${Date.now()}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], `${slug}-simdi.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: "şimdi çalıyor — necaliyor.co" });
        return;
      }
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${slug}-simdi.png`;
      a.click();
      URL.revokeObjectURL(href);
      setKart("hazir");
      setTimeout(() => setKart("idle"), 1600);
    } catch {
      setKart("yok");
      setTimeout(() => setKart("idle"), 1600);
    }
  }

  const on = phase === "playing" || phase === "connecting";

  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        onClick={toggle}
        className="press inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold"
        style={{ background: accent, color: readableOn(accent) }}
      >
        {on ? "❚❚ Durdur" : "▶ Canlı Dinle"}
      </button>
      <span className="text-sm" style={{ color: "var(--muted)" }}>
        {phase === "connecting" ? "bağlanıyor…" : phase === "error" ? "yayına ulaşılamadı" : ""}
      </span>
      <button
        onClick={paylasKart}
        className="press ml-auto rounded-full border px-4 py-2 text-sm"
        style={{ borderColor: "var(--line)", color: "var(--fg)" }}
      >
        {kart === "hazir" ? "kart indi ✓" : kart === "yok" ? "kart yok" : "kart"}
      </button>
      <button
        onClick={share}
        className="press rounded-full border px-4 py-2 text-sm"
        style={{ borderColor: "var(--line)", color: "var(--fg)" }}
      >
        {copied ? "kopyalandı ✓" : "paylaş"}
      </button>
      <audio
        ref={audioRef}
        onPlaying={() => {
          retries.current = 0;
          setPhase("playing");
        }}
        onWaiting={() => setPhase((p) => (p === "idle" ? p : "connecting"))}
        onEnded={reconnect}
        onError={reconnect}
      />
    </div>
  );
}
