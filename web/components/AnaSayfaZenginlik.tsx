"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDil, turAdi } from "@/lib/i18n";
import { sarkiSlug } from "@/lib/seoslug";

/* ANA SAYFA ZENGİNLİĞİ — veritabanına EK SORGU atmadan, sayfaya zaten gelen
   canlı istasyon listesinden hesaplanan analizler + istasyon listesinin arasına
   serpiştirilen keşif kartları (menüdeki oyunlar, listeler, araçlar). */

type Stn = {
  slug: string;
  name: string;
  band: "tr" | "int" | "own";
  genre: string | null;
  accentColor: string | null;
  nowPlaying: { artist: string | null; title: string | null; updatedAt: string } | null;
};

const TAZE_MS = 20 * 60 * 1000;
const norm = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

function Baslik({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono mb-2.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
      {children}
    </p>
  );
}

/* TÜRKİYE ŞU AN — canlı listeden üç gözlem: kaç radyo çalıyor, şu an en çok
   radyoda çalan sanatçı (≥2), türlerin anlık dağılımı. */
export function TurkiyeSuAn({ stations, onTune }: { stations: Stn[]; onTune: (slug: string) => void }) {
  const { dil } = useDil();
  const en = dil === "en";

  const a = useMemo(() => {
    const simdi = Date.now();
    const taze = stations.filter(
      (s) => s.nowPlaying?.title && simdi - Date.parse(s.nowPlaying.updatedAt) < TAZE_MS,
    );
    const tr = taze.filter((s) => s.band !== "int");
    const dunya = taze.filter((s) => s.band === "int").length;

    // Sanatçı → hangi TR radyolarında şu an
    const sanatci = new Map<string, { ad: string; ist: Stn[] }>();
    for (const s of tr) {
      const ad = s.nowPlaying?.artist?.trim();
      if (!ad || ad.length < 2 || norm(ad) === norm(s.nowPlaying?.title || "") || norm(ad) === norm(s.name)) continue;
      const k = norm(ad);
      const v = sanatci.get(k) ?? { ad, ist: [] };
      v.ist.push(s);
      sanatci.set(k, v);
    }
    const lider = [...sanatci.values()].sort((x, y) => y.ist.length - x.ist.length)[0];

    // Tür dağılımı (çalan TR radyoları)
    const tur = new Map<string, number>();
    for (const s of tr) if (s.genre) tur.set(s.genre, (tur.get(s.genre) || 0) + 1);
    const turler = [...tur.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5);
    const turToplam = turler.reduce((t, [, n]) => t + n, 0) || 1;

    return { tr: tr.length, dunya, lider: lider && lider.ist.length >= 2 ? lider : null, turler, turToplam };
  }, [stations]);

  if (a.tr === 0) return null;
  const renk = ["#e5382c", "#ee5a3f", "#ff9b76", "#f6b896", "#f2e6da"];

  return (
    <section className="surf mb-5 p-4" aria-label={en ? "Turkey right now" : "Türkiye şu an"}>
      <Baslik>
        <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: "#e5382c", boxShadow: "0 0 10px #e5382c" }} />
        {en ? "Turkey right now" : "Türkiye şu an"}
      </Baslik>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <span className="brand block text-[34px] font-bold leading-none tabular-nums" style={{ color: "var(--glow-hi)" }}>{a.tr}</span>
          <span className="mt-1 block text-[12px]" style={{ color: "var(--muted)" }}>
            {en ? `Turkish stations playing a song · ${a.dunya} more worldwide` : `Türk radyosunda şu an şarkı çalıyor · dünyada ${a.dunya} radyo daha`}
          </span>
        </div>

        <div className="sm:col-span-2">
          {a.lider ? (
            <>
              <span className="block text-[12px]" style={{ color: "var(--muted)" }}>
                {en ? `On ${a.lider.ist.length} stations at once:` : `Şu an ${a.lider.ist.length} radyoda aynı anda:`}
              </span>
              <Link prefetch={false} href={`/sanatci/${sarkiSlug(a.lider.ad)}`} className="dial mt-0.5 block truncate text-[22px] uppercase tracking-[0.02em] hover:underline">
                {a.lider.ad}
              </Link>
              <span className="mt-1 flex flex-wrap gap-1.5">
                {a.lider.ist.slice(0, 4).map((s) => (
                  <button key={s.slug} onClick={() => onTune(s.slug)} className="press rounded-full border px-2.5 py-1 text-[11px]" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
                    ▶ {s.name}
                  </button>
                ))}
              </span>
            </>
          ) : (
            <span className="block text-[13px]" style={{ color: "var(--muted)" }}>
              {en ? "Every station is playing a different artist right now." : "Şu an her radyoda başka bir sanatçı çalıyor."}
            </span>
          )}
        </div>
      </div>

      {a.turler.length > 1 && (
        <div className="mt-4">
          <span className="mb-1.5 block text-[11px]" style={{ color: "var(--muted)" }}>{en ? "What the dial is playing, by genre" : "Kadranda şu an türler"}</span>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
            {a.turler.map(([t, n], i) => (
              <span key={t} style={{ width: `${(n / a.turToplam) * 100}%`, background: renk[i] }} title={`${turAdi(dil, t)} ${n}`} />
            ))}
          </div>
          <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: "var(--muted)" }}>
            {a.turler.map(([t, n], i) => (
              <span key={t} className="flex items-center gap-1">
                <i className="inline-block h-2 w-2 rounded-full" style={{ background: renk[i] }} />
                {turAdi(dil, t)} %{Math.round((n / a.turToplam) * 100)}
              </span>
            ))}
          </span>
        </div>
      )}
    </section>
  );
}

/* KEŞİF KARTLARI — istasyon listesinin arasına serpiştirilir (her 8 radyoda bir). */
type Kart = { href?: string; eylem?: "siir"; ikon: string; tr: [string, string, string]; en: [string, string, string] };
const KARTLAR: Kart[] = [
  { href: "/oyun/gunun-frekansi", ikon: "🎯", tr: ["Günün Frekansı", "Herkese aynı gizli radyo. 3 hakta bul, karneni paylaş.", "Oyna"], en: ["Daily Frequency", "Same secret station for everyone. Find it in 3 tries.", "Play"] },
  { href: "/fal", ikon: "🔮", tr: ["Frekans Falı", "Ruh hâlini seç: sana bir dize ve bir radyo çıksın.", "Falına bak"], en: ["Frequency Fortune", "Pick a mood: get a line of poetry and a station.", "Read it"] },
  { href: "/gece", ikon: "🌙", tr: ["Gece 3 Listesi", "Türkiye uyurken radyolar ne çalıyor?", "Listeye bak"], en: ["3 AM Chart", "What do stations play while Turkey sleeps?", "See the chart"] },
  { href: "/oyun/kor-dinleme", ikon: "🎧", tr: ["Kör Dinleme", "Sadece sesi duy: hangi radyo çalıyor?", "Tahmin et"], en: ["Blind Listening", "Just listen: which station is it?", "Guess"] },
  { href: "/rekorlar", ikon: "🎖", tr: ["Rekorlar", "En çok çalan, en uzun, en sadık radyo.", "Rekorlara bak"], en: ["Records", "Most played, longest, most loyal.", "See records"] },
  { eylem: "siir", ikon: "📖", tr: ["Şiir Köşesi", "Şiir Rafım Radyosu'ndan sesli şiirler.", "Dinle"], en: ["Poetry Corner", "Spoken poems from Şiir Rafım Radio.", "Listen"] },
  { href: "/oyun/nereden", ikon: "🌍", tr: ["Nereden Çalıyor?", "Dünya radyosunu dinle, ülkesini bil.", "Oyna"], en: ["Where's It From?", "Listen to a world station, guess the country.", "Play"] },
  { href: "/arsiv", ikon: "⏳", tr: ["Zaman Makinesi", "Geçmişte o saatte hangi radyo ne çaldı?", "Geçmişe git"], en: ["Time Machine", "What played on which station back then?", "Go back"] },
  { href: "/senkron", ikon: "⚡", tr: ["Senkron Defteri", "Birbirinden habersiz radyolar, aynı şarkı, aynı dakika.", "Defteri aç"], en: ["Sync Moments", "Unconnected stations, same song, same minute.", "Open"] },
  { href: "/endeks", ikon: "📰", tr: ["Radyo Endeksi", "Ayın gerçek listesi: 7/24 sayımla.", "Endekse bak"], en: ["Radio Index", "The month's real chart, counted 24/7.", "See index"] },
];
export const KESIF_ARALIK = 8;
export const KESIF_SAYI = KARTLAR.length; // her kart bir kez (ilk ~80 radyonun arasına)

export function KesifKarti({ sira, onSiir }: { sira: number; onSiir: () => void }) {
  const { dil } = useDil();
  const k = KARTLAR[sira % KARTLAR.length];
  const [ad, alt, cta] = dil === "en" ? k.en : k.tr;
  const govde = (
    <>
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: "color-mix(in srgb, var(--glow) 12%, var(--panel))" }}>{k.ikon}</span>
      <span className="min-w-0 flex-1">
        <span className="dial block text-[16px] uppercase tracking-[0.03em]">{ad}</span>
        <span className="block text-[12px] leading-snug" style={{ color: "var(--muted)" }}>{alt}</span>
      </span>
      <span className="mono shrink-0 text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--glow-hi)" }}>{cta} →</span>
    </>
  );
  const sinif = "press my-2 flex w-full items-center gap-3 rounded-2xl border border-dashed px-3 py-3 text-left";
  const stil = { borderColor: "color-mix(in srgb, var(--glow) 35%, var(--line))" };
  return (
    <li aria-label={ad}>
      {k.eylem === "siir" ? (
        <button onClick={onSiir} className={sinif} style={stil}>{govde}</button>
      ) : (
        <Link prefetch={false} href={k.href!} className={sinif} style={stil}>{govde}</Link>
      )}
    </li>
  );
}
