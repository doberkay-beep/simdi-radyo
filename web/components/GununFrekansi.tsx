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

/* Gün numarası ve tohum — HERKESE aynı gün, aynı frekans.
   Epoch: 30 Eylül 2026 = #1. Gün sınırı Türkiye saatiyle döner. */
const EPOCH = Date.UTC(2026, 8, 29); // 29 Eyl UTC gecesi = 30 Eyl TR sabahı
function bugunTR(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}
function gunNo(tarih: string): number {
  const [y, m, d] = tarih.split("-").map(Number);
  return Math.max(1, Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86400000));
}

/* Deterministik PRNG — aynı tohum, aynı sıra (her tarayıcıda aynı oyun). */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* Kaba kıta etiketi — ilk ipucu. */
function kita(kod: UlkeKodu): string {
  const sira = ULKELER[kod].sira;
  if (kod === "au") return "Okyanusya";
  if (["ma", "eg", "ng", "ke", "za"].includes(kod)) return "Afrika";
  if (kod === "ae") return "Orta Doğu";
  if (sira >= 50 && sira <= 56) return "Amerika kıtası";
  if (sira >= 40 && sira <= 48) return "Asya";
  return "Avrupa";
}

function yerelSaat(kod: UlkeKodu): string | null {
  const dilim = SAAT_DILIMI[kod];
  if (!dilim) return null;
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: dilim }).format(new Date());
}

type Kayit = { gun: string; tahminler: UlkeKodu[]; bitti: boolean };

// Günün Frekansı — herkese aynı gizli radyo; 3 tahmin, paylaşılabilir karne.
export default function GununFrekansi() {
  const [havuz, setHavuz] = useState<Station[]>([]);
  const [tahminler, setTahminler] = useState<UlkeKodu[]>([]);
  const [bitti, setBitti] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [caliyor, setCaliyor] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tarih = useMemo(() => bugunTR(), []);
  const no = useMemo(() => gunNo(tarih), [tarih]);

  useEffect(() => {
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
          .filter((s: Station) => s.ulke !== "tr" && s.ulke !== "www")
          .sort((a: Station, b: Station) => a.slug.localeCompare(b.slug)); // sabit sıra → sabit seçim
        setHavuz(list);
      })
      .catch(() => {});
    // Bugünün kaydı varsa geri yükle
    try {
      const k: Kayit = JSON.parse(localStorage.getItem("gf_kayit") || "null");
      if (k && k.gun === bugunTR()) {
        setTahminler(k.tahminler);
        setBitti(k.bitti);
      }
    } catch {
      // yoksay
    }
    return () => audioRef.current?.pause();
  }, []);

  /* Günün istasyonu + 8 deterministik şık (doğrusu dahil, sırası da sabit). */
  const { cevap, secenekler } = useMemo(() => {
    if (havuz.length < 8) return { cevap: null as Station | null, secenekler: [] as UlkeKodu[] };
    const rnd = mulberry32(hashStr(`simdi-gf-${tarih}`));
    const dogru = havuz[Math.floor(rnd() * havuz.length)];
    const digerleri = [...new Set(havuz.map((s) => s.ulke))].filter((u) => u !== dogru.ulke);
    // Fisher–Yates, deterministik
    for (let i = digerleri.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [digerleri[i], digerleri[j]] = [digerleri[j], digerleri[i]];
    }
    const secim = [dogru.ulke, ...digerleri.slice(0, 7)];
    for (let i = secim.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [secim[i], secim[j]] = [secim[j], secim[i]];
    }
    return { cevap: dogru, secenekler: secim };
  }, [havuz, tarih]);

  const kazandi = cevap ? tahminler.includes(cevap.ulke) : false;

  function dinle() {
    if (!cevap) return;
    const a = audioRef.current;
    if (!a) return;
    if (caliyor) {
      a.pause();
      setCaliyor(false);
    } else {
      a.src = `/api/stream/${cevap.slug}?r=${Date.now()}`;
      a.play().catch(() => {});
      setCaliyor(true);
    }
  }

  function tahminEt(kod: UlkeKodu) {
    if (bitti || !cevap || tahminler.includes(kod)) return;
    const yeni = [...tahminler, kod];
    const bittiMi = kod === cevap.ulke || yeni.length >= 3;
    setTahminler(yeni);
    setBitti(bittiMi);
    try {
      localStorage.setItem("gf_kayit", JSON.stringify({ gun: tarih, tahminler: yeni, bitti: bittiMi } satisfies Kayit));
    } catch {
      // yoksay
    }
  }

  const karne = useMemo(() => {
    if (!cevap) return "";
    const kutular = tahminler.map((t) => (t === cevap.ulke ? "🟩" : "⬛")).join("");
    const skor = kazandi ? `${tahminler.length}/3` : "X/3";
    return `🌍 Günün Frekansı #${no}\n${kutular} ${skor}\nnecaliyor.co/oyun/gunun-frekansi`;
  }, [cevap, tahminler, kazandi, no]);

  function kopyala() {
    navigator.clipboard?.writeText(karne).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }).catch(() => {});
  }

  const accent = useMemo(() => cevap?.accentColor || "#6b7280", [cevap]);

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: accent }}>
      <div className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">Günün Frekansı</h1>
            <p className="epigraf mt-2 text-[15px]">
              herkese aynı gizli radyo — #{no} · 3 hakkın var.
            </p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/oyun" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← oyunlar
            </Link>
          </span>
        </header>

        {!cevap && <p className="epigraf">günün frekansı ayarlanıyor…</p>}

        {cevap && (
          <>
            {/* Dinleme kutusu */}
            <div className="mb-4 flex items-center gap-4 rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
              <button
                onClick={dinle}
                className="press rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ background: "var(--fg)", color: "var(--bg)" }}
              >
                {caliyor ? "⏸ durdur" : "▶ dinle"}
              </button>
              <span className={`eq ${caliyor ? "phase" : ""}`} aria-hidden>
                <span /><span /><span /><span /><span />
              </span>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {bitti ? (kazandi ? "buldun! 🌍" : "olmadı — yarın yenisi") : "hangi ülkeden yayında?"}
              </span>
            </div>

            {/* İpuçları — her yanlıştan sonra biri açılır */}
            {!bitti && tahminler.length >= 1 && (
              <p className="mb-2 text-sm" style={{ color: "var(--muted)" }}>
                💡 ipucu 1: {kita(cevap.ulke)}
              </p>
            )}
            {!bitti && tahminler.length >= 2 && (
              <p className="mb-2 text-sm" style={{ color: "var(--muted)" }}>
                💡 ipucu 2: orada saat şu an {yerelSaat(cevap.ulke)}
              </p>
            )}

            {/* Ülke şıkları */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {secenekler.map((kod) => {
                const denendi = tahminler.includes(kod);
                const dogruMu = kod === cevap.ulke;
                return (
                  <button
                    key={kod}
                    onClick={() => tahminEt(kod)}
                    disabled={bitti || denendi}
                    className="press rounded-xl border px-4 py-3.5 text-left text-[15px] font-semibold"
                    style={{
                      borderColor:
                        (bitti && dogruMu) ? "#3ddc84" : denendi ? "#e0475f" : "var(--line)",
                      background:
                        bitti && dogruMu
                          ? "color-mix(in srgb, #3ddc84 15%, transparent)"
                          : denendi
                            ? "color-mix(in srgb, #e0475f 12%, transparent)"
                            : "transparent",
                      opacity: denendi && !dogruMu ? 0.55 : 1,
                    }}
                  >
                    <span className="mr-2">{bayrakEmoji(kod)}</span>
                    {ULKELER[kod].tr}
                  </button>
                );
              })}
            </div>

            {/* Sonuç + paylaşım karnesi */}
            {bitti && (
              <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
                <p className="text-sm">
                  <strong>{cevap.name}</strong>
                  <span style={{ color: "var(--muted)" }}> — {bayrakEmoji(cevap.ulke)} {ULKELER[cevap.ulke].tr}</span>
                  {" · "}
                  <Link href={`/ulke/${ulkeSlug(cevap.ulke)}`} className="underline" style={{ color: "var(--accent)" }}>
                    radyoları →
                  </Link>
                </p>
                <pre className="mono mt-4 whitespace-pre-wrap rounded-lg border p-4 text-sm" style={{ borderColor: "var(--line)" }}>
                  {karne}
                </pre>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={kopyala}
                    className="press rounded-full px-5 py-2.5 text-sm font-semibold"
                    style={{ background: "var(--fg)", color: "var(--bg)" }}
                  >
                    {kopyalandi ? "kopyalandı ✓" : "karneyi kopyala"}
                  </button>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(karne)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline"
                    style={{ color: "var(--muted)" }}
                  >
                    X&apos;te paylaş
                  </a>
                </div>
                <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                  Türkiye saatiyle gece yarısı yeni frekans. 🕯
                </p>
              </div>
            )}
          </>
        )}

        <audio ref={audioRef} onPause={() => setCaliyor(false)} onPlay={() => setCaliyor(true)} />
      </div>
    </div>
  );
}
