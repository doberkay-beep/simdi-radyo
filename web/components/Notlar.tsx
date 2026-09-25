"use client";

import { useEffect, useRef, useState } from "react";
import { useDil, type Dil } from "@/lib/i18n";

type Not = { id: number; slug: string; not: string; createdAt: string; kalp?: number };

function kalpliOku(): number[] {
  try {
    return JSON.parse(localStorage.getItem("defterKalp") || "[]") as number[];
  } catch {
    return [];
  }
}

function nezaman(iso: string, dil: Dil): string {
  const d = new Date(iso).getTime();
  const fark = Math.max(0, Date.now() - d);
  const dk = Math.floor(fark / 60000);
  const en = dil === "en";
  if (dk < 1) return en ? "just now" : "az önce";
  if (dk < 60) return en ? `${dk} min ago` : `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return en ? `${sa} h ago` : `${sa} sa önce`;
  const g = Math.floor(sa / 24);
  return en ? `${g} d ago` : `${g} gün önce`;
}

// Kalp defteri — bir istasyona kısa anı bırak (140 karakter, link yok).
export default function Notlar({ slug, accent }: { slug: string; accent: string }) {
  const { t, dil } = useDil();
  const [notlar, setNotlar] = useState<Not[]>([]);
  const [metin, setMetin] = useState("");
  const [durum, setDurum] = useState<"idle" | "gonderiliyor" | "hata">("idle");
  const [kalpli, setKalpli] = useState<number[]>([]);
  const bekle = useRef(0);

  useEffect(() => setKalpli(kalpliOku()), []);

  function notKalp(id: number) {
    if (kalpli.includes(id)) return;
    const yeni = [...kalpli, id];
    setKalpli(yeni);
    try {
      localStorage.setItem("defterKalp", JSON.stringify(yeni.slice(-200)));
    } catch { /* yoksay */ }
    setNotlar((n) => n.map((x) => (x.id === id ? { ...x, kalp: (x.kalp || 0) + 1 } : x)));
    fetch("/api/not-kalp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  useEffect(() => {
    let off = false;
    fetch(`/api/not?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !off && setNotlar(d.notlar ?? []))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [slug]);

  async function birak(e: React.FormEvent) {
    e.preventDefault();
    const t = metin.trim();
    if (t.length < 2 || t.length > 140) return;
    const now = Date.now();
    if (now - bekle.current < 3000) return;
    bekle.current = now;
    setDurum("gonderiliyor");
    try {
      const res = await fetch("/api/not", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, not: t }),
      });
      const d = await res.json();
      if (d.not) {
        setNotlar((n) => [d.not, ...n]);
        setMetin("");
        setDurum("idle");
      } else {
        setDurum("hata");
      }
    } catch {
      setDurum("hata");
    }
  }

  return (
    <section className="surf mt-8 p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="read text-2xl" style={{ fontWeight: 600 }}>
          {t("defter.baslik")}
        </h2>
        {notlar.length > 0 && (
          <span
            className="mono shrink-0 rounded-full border px-2.5 py-1 text-[11px]"
            style={{ color: accent, borderColor: `color-mix(in srgb, ${accent} 40%, var(--line))` }}
          >
            {notlar.length} {dil === "en" ? "notes" : "anı"}
          </span>
        )}
      </div>
      <form onSubmit={birak} className="flex gap-2">
        <input
          value={metin}
          onChange={(e) => {
            setMetin(e.target.value);
            if (durum === "hata") setDurum("idle");
          }}
          maxLength={140}
          placeholder={t("defter.yer")}
          className="field flex-1"
        />
        <button
          type="submit"
          disabled={durum === "gonderiliyor" || metin.trim().length < 2}
          className="dial press shrink-0 rounded-xl px-5 text-sm uppercase tracking-[0.06em] disabled:opacity-50"
          style={{ background: accent, color: "#0a0a0b", fontWeight: 500 }}
        >
          {t("defter.birak")}
        </button>
      </form>
      {durum === "hata" && (
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          {t("defter.hata")}
        </p>
      )}

      {notlar.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-4">
          {notlar.map((n) => (
            <li key={n.id} className="read border-l-2 pl-4" style={{ borderColor: accent }}>
              <p className="text-[15px] italic" style={{ color: "var(--fg)" }}>
                {n.not}
              </p>
              <p className="mono mt-1.5 flex items-center gap-3 text-[10px] tracking-[0.04em]" style={{ color: "var(--faint)" }}>
                <span>{nezaman(n.createdAt, dil)}</span>
                <button
                  type="button"
                  onClick={() => notKalp(n.id)}
                  aria-label="nota kalp bırak"
                  className="press text-xs leading-none"
                  style={{ color: kalpli.includes(n.id) ? accent : "var(--faint)" }}
                >
                  {kalpli.includes(n.id) ? "♥" : "♡"}
                  {(n.kalp || 0) > 0 ? ` ${n.kalp}` : ""}
                </button>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="epigraf mt-4 text-sm">{t("defter.ilk")}</p>
      )}
    </section>
  );
}
