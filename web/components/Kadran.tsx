"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* KADRAN — analog radyo ayar şeridi.
   İstasyonlar bir frekans bandı gibi dizilir; ortadaki ibre sabittir, bant
   kaydırılır. Orta çizgiye gelen istasyon "ayarlanır" (LCD'de adı + rengi),
   çentiğe dokununca çalar. Görsel frekanslar süs: 87.5→108.0 aralığına yayılır. */

type KadranIstasyon = {
  slug: string;
  name: string;
  accent_color: string | null;
  nowText?: string | null;
};

const ARALIK = 30; // çentikler arası px

export default function Kadran({
  stations,
  playing,
  onTune,
}: {
  stations: KadranIstasyon[];
  playing: string | null;
  onTune: (slug: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [merkez, setMerkez] = useState(0);

  /* İstasyon arası cızırtı — bant kayarken kısa white-noise, çentiğe oturunca susar.
     AudioContext ilk kullanıcı etkileşiminde (scroll bir jesttir) kurulur. */
  const ses = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const sesTimer = useRef<number | null>(null);
  function cizirti() {
    try {
      if (typeof AudioContext === "undefined") return;
      if (!ses.current) {
        const ctx = new AudioContext();
        const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const filt = ctx.createBiquadFilter();
        filt.type = "bandpass"; filt.frequency.value = 4200; filt.Q.value = 0.55;
        const gain = ctx.createGain(); gain.gain.value = 0;
        src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
        src.start();
        ses.current = { ctx, gain };
      }
      const { ctx, gain } = ses.current;
      if (ctx.state === "suspended") void ctx.resume();
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0.022, ctx.currentTime, 0.03);
      if (sesTimer.current) window.clearTimeout(sesTimer.current);
      sesTimer.current = window.setTimeout(() => {
        const s = ses.current;
        if (s) s.gain.gain.setTargetAtTime(0, s.ctx.currentTime, 0.07);
      }, 150);
    } catch { /* ses kurulamazsa sessiz kal */ }
  }
  useEffect(() => () => { ses.current?.ctx.close().catch(() => {}); }, []);

  const frekans = useMemo(() => {
    const n = Math.max(stations.length - 1, 1);
    return stations.map((_, i) => (87.5 + (i / n) * (108 - 87.5)).toFixed(1));
  }, [stations]);

  // Çalan istasyon değişince bandı ona kaydır.
  useEffect(() => {
    if (!playing) return;
    const i = stations.findIndex((s) => s.slug === playing);
    if (i < 0) return;
    trackRef.current?.scrollTo({ left: i * ARALIK, behavior: "smooth" });
  }, [playing, stations]);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / ARALIK);
    const yeni = Math.max(0, Math.min(stations.length - 1, i));
    if (yeni !== merkez) cizirti();
    setMerkez(yeni);
  }

  if (stations.length === 0) return null;
  const aktif = stations[Math.min(merkez, stations.length - 1)];
  const calan = playing ? stations.find((s) => s.slug === playing) : null;
  const gosterilen = calan ?? aktif;
  const renk = gosterilen?.accent_color || "#6b7280";

  return (
    <div
      className="mb-5 overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--line)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--fg) 4%, transparent), transparent 55%), color-mix(in srgb, var(--bg) 88%, #000)",
        boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--fg) 9%, transparent)",
      }}
    >
      {/* LCD penceresi */}
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3">
        <button
          onClick={() => gosterilen && onTune(gosterilen.slug)}
          className="min-w-0 text-left"
          aria-label={`${gosterilen?.name} çal`}
        >
          <span
            className="block truncate text-[15px] font-semibold tracking-tight transition-colors duration-500"
            style={{ color: renk }}
          >
            {calan ? "● " : ""}{gosterilen?.name}
          </span>
          <span className="block h-4 truncate text-xs" style={{ color: "var(--muted)" }} suppressHydrationWarning>
            {gosterilen?.nowText || (calan ? "canlı" : "dokun, çalsın")}
          </span>
        </button>
        <span
          className="brand shrink-0 text-lg font-bold tabular-nums transition-colors duration-500"
          style={{ color: renk }}
          suppressHydrationWarning
        >
          {frekans[stations.indexOf(gosterilen!)] ?? "—"}
        </span>
      </div>

      {/* Bant */}
      <div className="relative mt-1" style={{ height: 62 }}>
        {/* Sabit ibre */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-px -translate-x-1/2 transition-colors duration-500"
          style={{ background: renk, boxShadow: `0 0 12px ${renk}` }}
          aria-hidden
        />
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="kadran-band h-full overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <div
            className="relative flex h-full items-end"
            style={{ width: (stations.length - 1) * ARALIK + 2, margin: "0 50%" }}
          >
            {stations.map((s, i) => {
              const seçili = s.slug === playing;
              const merkezde = i === merkez;
              return (
                <button
                  key={s.slug}
                  onClick={() => onTune(s.slug)}
                  className="group absolute bottom-0 flex h-full w-[2px] items-end"
                  style={{ left: i * ARALIK }}
                  aria-label={`${s.name} — çal`}
                  title={s.name}
                >
                  <span
                    className="mx-auto block w-[2px] rounded-t transition-all duration-200"
                    style={{
                      height: seçili ? 44 : merkezde ? 36 : i % 5 === 0 ? 26 : 16,
                      background: seçili || merkezde ? (s.accent_color || "var(--fg)") : "color-mix(in srgb, var(--fg) 34%, transparent)",
                      boxShadow: seçili ? `0 0 10px ${s.accent_color || "var(--fg)"}` : undefined,
                    }}
                  />
                </button>
              );
            })}
            {/* Frekans rakamları — her 10 çentikte bir */}
            {stations.map((_, i) =>
              i % 10 === 0 ? (
                <span
                  key={`f${i}`}
                  className="pointer-events-none absolute top-1 text-[10px] tabular-nums"
                  style={{ left: i * ARALIK - 10, color: "var(--muted)" }}
                  aria-hidden
                >
                  {frekans[i]}
                </span>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
