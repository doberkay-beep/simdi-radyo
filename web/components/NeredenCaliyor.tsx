"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import {
  ULKELER,
  SAAT_DILIMI,
  bayrakEmoji,
  istasyonUlkesi,
  ulkeSlug,
  type UlkeKodu,
} from "@/lib/ulkeler";

type Station = { slug: string; name: string; accentColor: string | null; ulke: UlkeKodu };

function karistir<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

/* Ülkenin şu anki yerel saati + günün evine göre küçük bir cümle —
   Gece Pencereleri'nin oyundaki yankısı. */
function yerelSaat(kod: UlkeKodu): { saat: string; not: string } | null {
  const dilim = SAAT_DILIMI[kod];
  if (!dilim) return null;
  const saat = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: dilim,
  }).format(new Date());
  const h = Number(saat.slice(0, 2));
  const not =
    h >= 21 || h < 5 ? "pencereler yanıyor 🕯" : h < 9 ? "sabahın körü" : h < 18 ? "gün ışığı" : "akşam iniyor";
  return { saat, not };
}

// Nereden Çalıyor? — dünyadan bir radyo kör çalar; hangi ülkeden yayında?
export default function NeredenCaliyor() {
  const [havuz, setHavuz] = useState<Station[]>([]);
  const [cevap, setCevap] = useState<Station | null>(null);
  const [secenekler, setSecenekler] = useState<UlkeKodu[]>([]);
  const [durum, setDurum] = useState<"yukleniyor" | "dinle" | "acildi">("yukleniyor");
  const [secilen, setSecilen] = useState<UlkeKodu | null>(null);
  const [skor, setSkor] = useState(0);
  const [seri, setSeri] = useState(0);
  const [rekor, setRekor] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const r = localStorage.getItem("nereden_rekor");
      if (r) setRekor(Number(r) || 0);
    } catch {
      // yoksay
    }
    fetch("/api/now", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list: Station[] = (d.stations ?? [])
          .map((s: { slug: string; name: string; accentColor: string | null }) => ({
            slug: s.slug,
            name: s.name,
            accentColor: s.accentColor,
            ulke: istasyonUlkesi(s.slug),
          }))
          .filter((s: Station) => s.ulke !== "tr" && s.ulke !== "www");
        setHavuz(list);
      })
      .catch(() => {});
    return () => audioRef.current?.pause();
  }, []);

  // Havuz gelince ilk turu kur.
  useEffect(() => {
    if (havuz.length >= 4 && durum === "yukleniyor") yeniTur(havuz);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [havuz]);

  function yeniTur(list: Station[]) {
    const dogru = list[Math.floor(Math.random() * list.length)];
    // Şıklar ülke düzeyinde: doğru ülke + katalogda istasyonu olan 3 başka ülke.
    const digerUlkeler = [...new Set(list.map((s) => s.ulke))].filter((u) => u !== dogru.ulke);
    const yanlislar = karistir(digerUlkeler).slice(0, 3);
    setCevap(dogru);
    setSecenekler(karistir([dogru.ulke, ...yanlislar]));
    setSecilen(null);
    setDurum("dinle");
    const a = audioRef.current;
    if (a) {
      a.src = `/api/stream/${dogru.slug}?r=${Date.now()}`;
      a.play().catch(() => {});
    }
  }

  function tahminEt(kod: UlkeKodu) {
    if (durum !== "dinle" || !cevap) return;
    setSecilen(kod);
    setDurum("acildi");
    if (kod === cevap.ulke) {
      const yeniSeri = seri + 1;
      setSkor((s) => s + 1);
      setSeri(yeniSeri);
      if (yeniSeri > rekor) {
        setRekor(yeniSeri);
        try {
          localStorage.setItem("nereden_rekor", String(yeniSeri));
        } catch {
          // yoksay
        }
      }
    } else {
      setSeri(0);
    }
  }

  const accent = useMemo(() => cevap?.accentColor || "#6b7280", [cevap]);
  const saatBilgi = useMemo(
    () => (durum === "acildi" && cevap ? yerelSaat(cevap.ulke) : null),
    [durum, cevap],
  );

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: accent }}>
      <div className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">Nereden Çalıyor?</h1>
            <p className="epigraf mt-2 text-[15px]">dünyadan bir radyo — hangi ülkeden yayında?</p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/oyun" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← oyunlar
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

        {durum === "yukleniyor" && <p className="epigraf">dünya frekansları hazırlanıyor…</p>}

        {durum !== "yukleniyor" && cevap && (
          <>
            {/* Dinleme durumu */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
              <span className={`eq ${durum === "dinle" ? "phase" : ""}`} aria-hidden>
                <span /><span /><span /><span /><span />
              </span>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {durum === "dinle"
                  ? "dinle — dil, tür, hava… hangi ülke?"
                  : secilen === cevap.ulke
                    ? "doğru! 🌍"
                    : "olmadı — doğrusu aşağıda"}
              </span>
            </div>

            {/* Ülke şıkları */}
            <div className="grid gap-3 sm:grid-cols-2">
              {secenekler.map((kod) => {
                const dogruMu = kod === cevap.ulke;
                const secildi = kod === secilen;
                const acik = durum === "acildi";
                return (
                  <button
                    key={kod}
                    onClick={() => tahminEt(kod)}
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
                    <span className="mr-2">{bayrakEmoji(kod)}</span>
                    {ULKELER[kod].tr}
                  </button>
                );
              })}
            </div>

            {durum === "acildi" && (
              <>
                {/* Perde açıldı: istasyon + o ülkede saat kaç */}
                <div className="mt-6 rounded-2xl border p-5 text-sm" style={{ borderColor: "var(--line)" }}>
                  <p>
                    <strong>{cevap.name}</strong>
                    <span style={{ color: "var(--muted)" }}> — {bayrakEmoji(cevap.ulke)} {ULKELER[cevap.ulke].tr}</span>
                  </p>
                  {saatBilgi && (
                    <p className="mt-1.5" style={{ color: "var(--muted)" }}>
                      orada saat <strong className="tabular-nums" style={{ color: "var(--fg)" }}>{saatBilgi.saat}</strong> · {saatBilgi.not}
                    </p>
                  )}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <Link
                    href={`/ulke/${ulkeSlug(cevap.ulke)}`}
                    className="text-sm underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {ULKELER[cevap.ulke].tr} radyoları →
                  </Link>
                  <button
                    onClick={() => yeniTur(havuz)}
                    className="press rounded-full px-6 py-2.5 text-sm font-semibold"
                    style={{ background: "var(--fg)", color: "var(--bg)" }}
                  >
                    sıradaki →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <audio ref={audioRef} />
      </div>
    </div>
  );
}
