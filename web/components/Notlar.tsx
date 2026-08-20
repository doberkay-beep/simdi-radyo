"use client";

import { useEffect, useRef, useState } from "react";

type Not = { id: number; slug: string; not: string; createdAt: string };

function nezaman(iso: string): string {
  const d = new Date(iso).getTime();
  const fark = Math.max(0, Date.now() - d);
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const g = Math.floor(sa / 24);
  return `${g} gün önce`;
}

// Kalp defteri — bir istasyona kısa anı bırak (140 karakter, link yok).
export default function Notlar({ slug, accent }: { slug: string; accent: string }) {
  const [notlar, setNotlar] = useState<Not[]>([]);
  const [metin, setMetin] = useState("");
  const [durum, setDurum] = useState<"idle" | "gonderiliyor" | "hata">("idle");
  const bekle = useRef(0);

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
    <section className="mt-10">
      <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        kalp defteri
      </h2>
      <form onSubmit={birak} className="flex gap-2">
        <input
          value={metin}
          onChange={(e) => {
            setMetin(e.target.value);
            if (durum === "hata") setDurum("idle");
          }}
          maxLength={140}
          placeholder="bir anı bırak… (140 karakter)"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          style={{ background: "transparent", borderColor: "var(--line)", color: "var(--fg)" }}
        />
        <button
          type="submit"
          disabled={durum === "gonderiliyor" || metin.trim().length < 2}
          className="press rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: accent, color: "#0a0a0b" }}
        >
          bırak
        </button>
      </form>
      {durum === "hata" && (
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Gönderilemedi — link olmasın, 2–140 karakter olsun.
        </p>
      )}

      {notlar.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-4">
          {notlar.map((n) => (
            <li key={n.id} className="read border-l-2 pl-4" style={{ borderColor: accent }}>
              <p className="text-[15px] italic" style={{ color: "var(--fg)" }}>
                {n.not}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                {nezaman(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="epigraf mt-4 text-sm">ilk anıyı sen bırak.</p>
      )}
    </section>
  );
}
