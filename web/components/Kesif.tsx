"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import DilToggle from "./DilToggle";
import { useDil, turAdi } from "@/lib/i18n";

type Station = {
  slug: string;
  name: string;
  city: string | null;
  frequency: string | null;
  accentColor: string | null;
  band: string | null;
  genre: string | null;
};

const DEFAULT_ACCENT = "#6b7280";

function readableOn(hex: string): string {
  const h = (hex || DEFAULT_ACCENT).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

// Ruh hali → hangi türler. Kullanıcının dilediği "havaya göre" keşif.
const RUHLAR: { key: string; ad: string; alt: string; turler: string[]; accent: string }[] = [
  { key: "sakin", ad: "sakin", alt: "yavaşla, derin bir nefes", turler: ["klasik", "caz", "tsm"], accent: "#6a86b8" },
  { key: "enerjik", ad: "enerjik", alt: "sesi aç, hızlan", turler: ["rock", "elektronik", "pop", "metal"], accent: "#c6503a" },
  { key: "hüzünlü", ad: "hüzünlü", alt: "biraz dert, biraz şehir", turler: ["arabesk", "türkü", "nostalji", "tsm"], accent: "#9c5f7c" },
  { key: "odak", ad: "odak", alt: "çalış, oku, dal", turler: ["klasik", "elektronik", "caz"], accent: "#5f8f8a" },
];

// Bir türü Türkçe okunur başlığa çevir (görsel için).
function turBaslik(t: string): string {
  return t === "türkçe pop" ? "türkçe pop" : t;
}

function Tile({ s }: { s: Station }) {
  const accent = s.accentColor || DEFAULT_ACCENT;
  return (
    <Link
      href={`/?ist=${s.slug}`}
      className="press row-in flex items-center gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--line)" }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
        style={{
          background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 50%, #000))`,
          color: readableOn(accent),
        }}
      >
        {s.name.trim().charAt(0).toLocaleUpperCase("tr")}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold">{s.name}</span>
        <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>
          {[s.genre, s.band === "int" ? s.city : s.frequency].filter(Boolean).join(" · ") || "canlı"}
        </span>
      </span>
    </Link>
  );
}

export default function Kesif() {
  const { t, dil } = useDil();
  const [stations, setStations] = useState<Station[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [ruh, setRuh] = useState<string>("sakin");
  const [zar, setZar] = useState<Station | null>(null);
  const [tur, setTur] = useState<string | null>(null);
  const [kalpler, setKalpler] = useState<Record<string, number>>({});

  useEffect(() => {
    let off = false;
    fetch("/api/now", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (off) return;
        setStations(d.stations ?? []);
        setStatus("idle");
      })
      .catch(() => !off && setStatus("error"));
    fetch("/api/kalp", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !off && d.kalpler && setKalpler(d.kalpler))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  // En sevilen istasyonlar (kalbe göre).
  const enSevilen = useMemo(() => {
    const withHearts = stations.filter((s) => kalpler[s.slug] > 0);
    withHearts.sort((a, b) => (kalpler[b.slug] || 0) - (kalpler[a.slug] || 0));
    return withHearts.slice(0, 6);
  }, [stations, kalpler]);

  // Günün istasyonu — güne göre deterministik (mount sonrası, SSR sorunsuz).
  const gununIst = useMemo(() => {
    if (!stations.length) return null;
    const d = new Date();
    const gun = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return stations[gun % stations.length];
  }, [stations]);

  const ruhAktif = RUHLAR.find((r) => r.key === ruh) || RUHLAR[0];
  const ruhList = useMemo(
    () => stations.filter((s) => s.genre && ruhAktif.turler.includes(s.genre)).slice(0, 8),
    [stations, ruhAktif],
  );

  // Türlere göre gruplar (kaç istasyon var).
  const turler = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stations) if (s.genre) m.set(s.genre, (m.get(s.genre) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [stations]);

  const turList = useMemo(
    () => (tur ? stations.filter((s) => s.genre === tur) : []),
    [stations, tur],
  );

  function zarAt() {
    if (!stations.length) return;
    setZar(stations[Math.floor(Math.random() * stations.length)]);
  }

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: ruhAktif.accent }}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">{t("kesif.baslik")}</h1>
            <p className="epigraf mt-2 text-[15px]">{t("kesif.alt")}</p>
          </div>
          <span className="flex items-center gap-3">
            <DilToggle />
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              {t("nav.simdi")}
            </Link>
          </span>
        </header>

        {status === "loading" && <p className="epigraf">{t("kesif.yukleniyor")}</p>}
        {status === "error" && <p style={{ color: "var(--muted)" }}>{t("kesif.hata")}</p>}

        {status === "idle" && (
          <>
            {/* Günün istasyonu + Zar */}
            <section className="mb-10 grid gap-3 sm:grid-cols-2">
              {gununIst && (
                <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    {t("kesif.gununIst")}
                  </div>
                  <div className="mt-2">
                    <Tile s={gununIst} />
                  </div>
                </div>
              )}
              <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    {t("kesif.zar")}
                  </div>
                  <button
                    onClick={zarAt}
                    className="press rounded-full border px-3 py-1 text-sm"
                    style={{ borderColor: "var(--line)", color: "var(--fg)" }}
                  >
                    {t("kesif.rastgele")}
                  </button>
                </div>
                <div className="mt-2">
                  {zar ? <Tile s={zar} /> : <p className="epigraf text-sm">{t("kesif.zarBos")}</p>}
                </div>
              </div>
            </section>

            {/* En sevilenler — kalbe göre */}
            {enSevilen.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  {t("kesif.enSevilen")}
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {enSevilen.map((s) => (
                    <div key={s.slug} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <Tile s={s} />
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: "#e0475f" }}>
                        ♥ {kalpler[s.slug]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Ruh haline göre */}
            <section className="mb-10">
              <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                {t("kesif.ruhHali")}
              </h2>
              <div className="mb-4 flex flex-wrap gap-2">
                {RUHLAR.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRuh(r.key)}
                    className="press rounded-full border px-4 py-1.5 text-sm"
                    style={{
                      borderColor: ruh === r.key ? r.accent : "var(--line)",
                      background: ruh === r.key ? `color-mix(in srgb, ${r.accent} 16%, transparent)` : "transparent",
                      color: ruh === r.key ? "var(--fg)" : "var(--muted)",
                    }}
                  >
                    {t(`ruh.${r.key}`)}
                  </button>
                ))}
              </div>
              <p className="epigraf mb-3 text-sm">{t(`ruh.${ruhAktif.key}.alt`)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ruhList.map((s) => (
                  <Tile key={s.slug} s={s} />
                ))}
                {ruhList.length === 0 && <p className="epigraf text-sm">{t("kesif.ruhBos")}</p>}
              </div>
            </section>

            {/* Türe göre gez */}
            <section className="mb-10">
              <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                {t("kesif.tureGore")}
              </h2>
              <div className="mb-4 flex flex-wrap gap-2">
                {turler.map(([t, n]) => (
                  <button
                    key={t}
                    onClick={() => setTur(tur === t ? null : t)}
                    className="press rounded-full border px-3 py-1 text-sm"
                    style={{
                      borderColor: tur === t ? "var(--accent)" : "var(--line)",
                      background: tur === t ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
                    }}
                  >
                    {turAdi(dil, t)} <span style={{ color: "var(--muted)" }}>{n}</span>
                  </button>
                ))}
              </div>
              {tur && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {turList.map((s) => (
                    <Tile key={s.slug} s={s} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
