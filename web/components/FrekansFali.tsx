"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { SOZLER, type Soz } from "@/lib/fal-korpus";
import { istasyonUlkesi, type UlkeKodu } from "@/lib/ulkeler";

type Station = { slug: string; name: string; genre: string | null; accentColor: string | null; ulke: UlkeKodu };

/* Ruh hâlleri — korpus temalarına ve istasyon türlerine köprü. */
const RUHLAR = [
  { id: "kirik", ad: "kalbim kırık", emoji: "💔", temalar: ["ask", "karanlik"], turler: ["arabesk", "tsm"], renk: "#c04a55" },
  { id: "baslangic", ad: "yeni bir başlangıç", emoji: "🌅", temalar: ["umut", "yikim"], turler: ["türkçe pop", "pop"], renk: "#e08a3c" },
  { id: "yalniz", ad: "yalnızım bu gece", emoji: "🌙", temalar: ["yalnizlik"], turler: ["caz", "nostalji"], renk: "#5a6fd0" },
  { id: "yangin", ad: "içimde bir yangın", emoji: "🔥", temalar: ["yikim", "ozgurluk"], turler: ["rock", "metal"], renk: "#d45230" },
  { id: "ozlem", ad: "özledim", emoji: "🍂", temalar: ["zaman", "sehir"], turler: ["nostalji", "türkü"], renk: "#a8794e" },
  { id: "sukunet", ad: "sükûnet arıyorum", emoji: "🕯", temalar: ["hayat", "sanat"], turler: ["klasik"], renk: "#6f9a78" },
] as const;
type Ruh = (typeof RUHLAR)[number];

const KITAP: Record<Soz["k"], string> = { mvk: "Mürekkep ve Köz", tas: "Tasfiye" };

function vakit(h: number): string {
  if (h < 6) return "GECE";
  if (h < 11) return "SABAH";
  if (h < 18) return "GÜNDÜZ";
  if (h < 22) return "AKŞAM";
  return "GECE";
}

function rastgele<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

/* Canvas'a sözcük kaydırmalı metin — satırları döndürür. */
function sardir(ctx: CanvasRenderingContext2D, metin: string, genislik: number): string[] {
  const kelimeler = metin.split(" ");
  const satirlar: string[] = [];
  let satir = "";
  for (const k of kelimeler) {
    const deneme = satir ? `${satir} ${k}` : k;
    if (ctx.measureText(deneme).width > genislik && satir) {
      satirlar.push(satir);
      satir = k;
    } else {
      satir = deneme;
    }
  }
  if (satir) satirlar.push(satir);
  return satirlar;
}

// Frekans Falı — ruh hâline göre bir dize + bir istasyon; story'lik kart üretir.
export default function FrekansFali() {
  const [stations, setStations] = useState<Station[]>([]);
  const [ruh, setRuh] = useState<Ruh | null>(null);
  const [soz, setSoz] = useState<Soz | null>(null);
  const [istasyon, setIstasyon] = useState<Station | null>(null);
  const [caliyor, setCaliyor] = useState(false);
  const [indi, setIndi] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const kartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch("/api/now", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list: Station[] = (d.stations ?? []).map(
          (s: { slug: string; name: string; genre: string | null; accentColor: string | null }) => ({
            slug: s.slug,
            name: s.name,
            genre: s.genre,
            accentColor: s.accentColor,
            ulke: istasyonUlkesi(s.slug),
          }),
        );
        setStations(list);
      })
      .catch(() => {});
    return () => audioRef.current?.pause();
  }, []);

  function falCek(r: Ruh) {
    // Dize: ruhun temalarından biriyle etiketli yayımlanmış satırlar.
    const uygunSozler = SOZLER.filter((s) => s.t.some((t) => (r.temalar as readonly string[]).includes(t)));
    // İstasyon: ruhun türlerinden çalan Türk istasyonları; yoksa tüm katalog.
    const uygunIst = stations.filter((s) => s.genre && (r.turler as readonly string[]).includes(s.genre));
    setRuh(r);
    setSoz(rastgele(uygunSozler));
    setIstasyon(uygunIst.length ? rastgele(uygunIst) : rastgele(stations));
    setIndi(false);
    audioRef.current?.pause();
    setCaliyor(false);
  }

  function dinle() {
    if (!istasyon) return;
    const a = audioRef.current;
    if (!a) return;
    if (caliyor) {
      a.pause();
      setCaliyor(false);
    } else {
      a.src = `/api/stream/${istasyon.slug}?r=${Date.now()}`;
      a.play().catch(() => {});
      setCaliyor(true);
    }
  }

  /* Kartı çiz + indir (1080×1920, IG story boyutu). */
  async function kartIndir(paylas: boolean) {
    if (!ruh || !soz || !istasyon) return;
    const cv = kartRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    await document.fonts.ready;
    const stil = getComputedStyle(document.documentElement);
    const fRead = stil.getPropertyValue("--font-read") || "Georgia";
    const fBrand = stil.getPropertyValue("--font-brand") || "sans-serif";
    const fMono = stil.getPropertyValue("--font-mono") || "monospace";
    const W = 1080, H = 1920;
    cv.width = W; cv.height = H;

    // Zemin: mürekkep gecesi + ruh renginde kor
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120a10");
    g.addColorStop(1, "#0a0508");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r1 = ctx.createRadialGradient(W / 2, H * 0.44, 60, W / 2, H * 0.44, 640);
    r1.addColorStop(0, ruh.renk + "38");
    r1.addColorStop(1, "transparent");
    ctx.fillStyle = r1;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    const saat = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    const h = new Date().getHours();

    // Üst: başlık + vakit
    ctx.fillStyle = "#e9b9a4";
    ctx.font = `700 34px ${fMono}`;
    ctx.fillText("F R E K A N S   F A L I N", W / 2, 190);
    ctx.fillStyle = "#8d6f63";
    ctx.font = `700 26px ${fMono}`;
    ctx.fillText(`${saat}  ·  ${vakit(h)}  ·  ${ruh.ad.toLocaleUpperCase("tr")}`, W / 2, 248);

    // Orta: dize
    ctx.fillStyle = "#f0e4da";
    ctx.font = `italic 300 62px ${fRead}`;
    const satirlar = sardir(ctx, `"${soz.s}"`, W - 220);
    const bloklaBas = H * 0.42 - ((satirlar.length - 1) * 84) / 2;
    satirlar.forEach((s, i) => ctx.fillText(s, W / 2, bloklaBas + i * 84));
    ctx.fillStyle = "#a08574";
    ctx.font = `italic 300 34px ${fRead}`;
    ctx.fillText(`— ${KITAP[soz.k]}, Berkay Doğan`, W / 2, bloklaBas + satirlar.length * 84 + 30);

    // Alt-orta: istasyon
    ctx.fillStyle = "#e9b9a4";
    ctx.font = `700 27px ${fMono}`;
    ctx.fillText("S A N A   D Ü Ş E N   F R E K A N S", W / 2, H - 500);
    ctx.fillStyle = "#f5ece4";
    ctx.font = `700 58px ${fBrand}`;
    ctx.fillText(istasyon.name, W / 2, H - 420);
    if (istasyon.genre) {
      ctx.fillStyle = "#8d6f63";
      ctx.font = `700 26px ${fMono}`;
      ctx.fillText(istasyon.genre.toLocaleUpperCase("tr"), W / 2, H - 368);
    }

    // Alt: marka
    ctx.fillStyle = "#f5ece4";
    ctx.font = `700 64px ${fBrand}`;
    ctx.fillText("ŞİMDİ", W / 2, H - 210);
    ctx.fillStyle = "#e9b9a4";
    ctx.font = `700 28px ${fMono}`;
    ctx.fillText("n e c a l i y o r . c o / f a l", W / 2, H - 150);

    cv.toBlob(async (blob) => {
      if (!blob) return;
      const dosya = new File([blob], "frekans-falim.png", { type: "image/png" });
      if (paylas && navigator.canShare?.({ files: [dosya] })) {
        try {
          await navigator.share({ files: [dosya] });
          return;
        } catch {
          // paylaşım iptal — indirmeye düş
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "frekans-falim.png";
      a.click();
      URL.revokeObjectURL(url);
      setIndi(true);
      setTimeout(() => setIndi(false), 2500);
    }, "image/png");
  }

  const accent = useMemo(() => ruh?.renk || istasyon?.accentColor || "#6b7280", [ruh, istasyon]);

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: accent }}>
      <div className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">Frekans Falı</h1>
            <p className="epigraf mt-2 text-[15px]">söyle: bu gece nasılsın? sana bir dize, bir de frekans düşsün.</p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        {/* Ruh hâli seçimi */}
        <div className="grid grid-cols-2 gap-3">
          {RUHLAR.map((r) => (
            <button
              key={r.id}
              onClick={() => falCek(r)}
              className="press rounded-xl border px-4 py-4 text-left text-[15px] font-semibold"
              style={{
                borderColor: ruh?.id === r.id ? r.renk : "var(--line)",
                background: ruh?.id === r.id ? `color-mix(in srgb, ${r.renk} 14%, transparent)` : "transparent",
              }}
            >
              <span className="mr-2" aria-hidden>{r.emoji}</span>
              {r.ad}
            </button>
          ))}
        </div>

        {/* Fal sonucu */}
        {ruh && soz && istasyon && (
          <div className="mt-8 rounded-2xl border p-6" style={{ borderColor: "var(--line)" }}>
            <p className="dize text-xl leading-relaxed">&ldquo;{soz.s}&rdquo;</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              — {KITAP[soz.k]}, Berkay Doğan
            </p>
            <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--line)" }}>
              <p className="mono text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                sana düşen frekans
              </p>
              <p className="mt-1.5 text-lg font-bold">
                {istasyon.name}
                {istasyon.genre && (
                  <span className="ml-2 text-sm font-normal" style={{ color: "var(--muted)" }}>
                    · {istasyon.genre}
                  </span>
                )}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={dinle}
                className="press rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ background: "var(--fg)", color: "var(--bg)" }}
              >
                {caliyor ? "⏸ durdur" : "▶ dinle"}
              </button>
              <button
                onClick={() => kartIndir(true)}
                className="press rounded-full border px-5 py-2.5 text-sm font-semibold"
                style={{ borderColor: "var(--line)" }}
              >
                {indi ? "kart indi ✓" : "kartını al 🔮"}
              </button>
              <button onClick={() => falCek(ruh)} className="text-sm underline" style={{ color: "var(--muted)" }}>
                yeniden çek
              </button>
            </div>
            <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
              kart story boyutunda iner — Instagram&apos;da paylaşırken bağlantıya necaliyor.co/fal yaz, falın arkadaşına da düşsün.
            </p>
          </div>
        )}

        <audio ref={audioRef} onPause={() => setCaliyor(false)} onPlay={() => setCaliyor(true)} />
        <canvas ref={kartRef} className="hidden" aria-hidden />
      </div>
    </div>
  );
}
