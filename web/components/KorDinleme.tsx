"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

type Station = { slug: string; name: string; genre: string | null; accentColor: string | null };

function karistir<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

// Kör dinleme — istasyon gizli, sadece ses. Hangi radyo tahmin et.
export default function KorDinleme() {
  const [stations, setStations] = useState<Station[]>([]);
  const [cevap, setCevap] = useState<Station | null>(null);
  const [secenekler, setSecenekler] = useState<Station[]>([]);
  const [durum, setDurum] = useState<"yukleniyor" | "dinle" | "acildi">("yukleniyor");
  const [secilen, setSecilen] = useState<string | null>(null);
  const [skor, setSkor] = useState(0);
  const [seri, setSeri] = useState(0);
  const [rekor, setRekor] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const r = localStorage.getItem("kor_rekor");
      if (r) setRekor(Number(r) || 0);
    } catch {
      // yoksay
    }
    fetch("/api/now", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list: Station[] = (d.stations ?? []).map((s: Station) => ({
          slug: s.slug,
          name: s.name,
          genre: s.genre,
          accentColor: s.accentColor,
        }));
        setStations(list);
      })
      .catch(() => {});
    return () => audioRef.current?.pause();
  }, []);

  // İstasyonlar gelince ilk turu kur.
  useEffect(() => {
    if (stations.length >= 4 && durum === "yukleniyor") yeniTur(stations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  function yeniTur(list: Station[]) {
    const dogru = list[Math.floor(Math.random() * list.length)];
    // Aynı türden yanıltıcılar tercih et (daha zor, daha keyifli).
    const digerleri = list.filter((s) => s.slug !== dogru.slug);
    const ayniTur = digerleri.filter((s) => s.genre && s.genre === dogru.genre);
    const havuz = karistir(ayniTur.length >= 3 ? ayniTur : digerleri).slice(0, 3);
    setCevap(dogru);
    setSecenekler(karistir([dogru, ...havuz]));
    setSecilen(null);
    setDurum("dinle");
    const a = audioRef.current;
    if (a) {
      a.src = `/api/stream/${dogru.slug}?r=${Date.now()}`;
      a.play().catch(() => {});
    }
  }

  function tahminEt(slug: string) {
    if (durum !== "dinle" || !cevap) return;
    setSecilen(slug);
    setDurum("acildi");
    if (slug === cevap.slug) {
      const yeniSeri = seri + 1;
      setSkor((s) => s + 1);
      setSeri(yeniSeri);
      if (yeniSeri > rekor) {
        setRekor(yeniSeri);
        try {
          localStorage.setItem("kor_rekor", String(yeniSeri));
        } catch {
          // yoksay
        }
      }
    } else {
      setSeri(0);
    }
  }

  const accent = useMemo(() => cevap?.accentColor || "#6b7280", [cevap]);

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: accent }}>
      <div className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">Kör Dinleme</h1>
            <p className="epigraf mt-2 text-[15px]">istasyon gizli — sadece ses. hangisi çalıyor?</p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        {/* Skor */}
        <div className="mb-8 flex items-center gap-6 text-sm">
          <span>
            skor <strong className="tabular-nums">{skor}</strong>
          </span>
          <span>
            seri <strong className="tabular-nums" style={{ color: "var(--accent)" }}>{seri}</strong>
          </span>
          <span style={{ color: "var(--muted)" }}>
            rekor <strong className="tabular-nums">{rekor}</strong>
          </span>
        </div>

        {durum === "yukleniyor" && <p className="epigraf">frekanslar hazırlanıyor…</p>}

        {durum !== "yukleniyor" && cevap && (
          <>
            {/* Dinleme durumu */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
              <span className={`eq ${durum === "dinle" ? "phase" : ""}`} aria-hidden>
                <span /><span /><span /><span /><span />
              </span>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {durum === "dinle" ? "dinle ve tahmin et…" : secilen === cevap.slug ? "doğru! 🎯" : "olmadı — doğrusu aşağıda"}
              </span>
            </div>

            {/* Seçenekler */}
            <div className="grid gap-3 sm:grid-cols-2">
              {secenekler.map((s) => {
                const dogruMu = s.slug === cevap.slug;
                const secildi = s.slug === secilen;
                const acik = durum === "acildi";
                return (
                  <button
                    key={s.slug}
                    onClick={() => tahminEt(s.slug)}
                    disabled={acik}
                    className="press rounded-xl border px-4 py-4 text-left text-[15px] font-semibold"
                    style={{
                      borderColor: acik && dogruMu ? "#3ddc84" : acik && secildi ? "#e0475f" : "var(--line)",
                      background:
                        acik && dogruMu
                          ? "color-mix(in srgb, #3ddc84 15%, transparent)"
                          : acik && secildi
                            ? "color-mix(in srgb, #e0475f 15%, transparent)"
                            : "transparent",
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>

            {durum === "acildi" && (
              <div className="mt-6 flex items-center justify-between">
                <Link href={`/radyo/${cevap.slug}`} className="text-sm underline" style={{ color: "var(--accent)" }}>
                  {cevap.name} sayfası →
                </Link>
                <button
                  onClick={() => yeniTur(stations)}
                  className="press rounded-full px-6 py-2.5 text-sm font-semibold"
                  style={{ background: "var(--fg)", color: "var(--bg)" }}
                >
                  sıradaki →
                </button>
              </div>
            )}
          </>
        )}

        <audio ref={audioRef} />
      </div>
    </div>
  );
}
