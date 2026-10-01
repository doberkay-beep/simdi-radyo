"use client";

import { useEffect, useRef } from "react";

// 🚗 SÜRÜŞ MODU — arabada telefon tutucuda: dev dokunma alanları, okunaklı
// şarkı adı, favoriler arasında tek dokunuşla geçiş, ekran kapanmaz (Wake Lock).
// Bakmadan kullanılabilsin diye her şey büyük ve yüksek kontrastlı.

export type SurusIstasyon = { slug: string; name: string; accentColor: string | null };

type WakeLock = { release: () => Promise<void> };

export default function SurusModu({
  liste, calan, baglaniyor, parca, istasyonAdi, onCal, kapat, dil,
}: {
  liste: SurusIstasyon[];
  calan: string | null;
  baglaniyor: boolean;
  parca: { artist: string | null; title: string | null } | null;
  istasyonAdi: string | null;
  onCal: (slug: string) => void;
  kapat: () => void;
  dil: string;
}) {
  const en = dil === "en";
  const kilit = useRef<WakeLock | null>(null);
  // Ana sayfa Realtime yüzünden sık render alır; kapat her seferinde yeni
  // fonksiyon gelir. Efekt yalnız açılışta kurulsun diye ref'te tutulur.
  const kapatRef = useRef(kapat);
  kapatRef.current = kapat;

  // Ekran açık kalsın; sekme geri gelince kilidi yenile (tarayıcı bırakır).
  useEffect(() => {
    const iste = async () => {
      try {
        const n = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLock> } };
        kilit.current = (await n.wakeLock?.request("screen")) ?? null;
      } catch { /* destek yok ya da reddedildi */ }
    };
    iste();
    const gorunurluk = () => { if (document.visibilityState === "visible") iste(); };
    document.addEventListener("visibilitychange", gorunurluk);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") kapatRef.current(); };
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("visibilitychange", gorunurluk);
      window.removeEventListener("keydown", esc);
      kilit.current?.release().catch(() => {});
    };
  }, []);

  const gec = (delta: number) => {
    if (!liste.length) return;
    const i = liste.findIndex((s) => s.slug === calan);
    const hedef = liste[(i + delta + liste.length) % liste.length];
    if (hedef) onCal(hedef.slug);
  };

  const calanIst = liste.find((s) => s.slug === calan);
  const renk = calanIst?.accentColor || "var(--glow)";
  const sarki = parca?.title ?? null;
  const sanatci = parca?.artist && parca.artist !== parca.title ? parca.artist : null;

  return (
    <div className="surus fixed inset-0 z-[90] flex flex-col p-4 sm:p-8" role="dialog" aria-label={en ? "drive mode" : "sürüş modu"}>
      <div className="flex items-center justify-between">
        <span className="mono text-sm font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          🚗 {en ? "DRIVE MODE" : "SÜRÜŞ MODU"}
        </span>
        <button onClick={kapat} className="surus-kucuk press" aria-label={en ? "exit drive mode" : "sürüş modundan çık"}>
          {en ? "exit" : "çık"} ✕
        </button>
      </div>

      {/* Şu an — bakışta okunur */}
      <div className="mt-4 min-h-0 flex-1 sm:mt-8">
        <p className="mono truncate text-base font-bold uppercase tracking-[0.14em]" style={{ color: renk }}>
          {baglaniyor ? (en ? "tuning…" : "bağlanıyor…") : istasyonAdi ?? (en ? "pick a station" : "bir istasyon seç")}
        </p>
        <p className="surus-sarki mt-2 font-bold leading-[1.05]">{sarki ?? (calan ? (en ? "live" : "canlı yayın") : "—")}</p>
        {sanatci && <p className="mt-2 truncate text-2xl" style={{ color: "var(--muted)" }}>{sanatci}</p>}
      </div>

      {/* Dev kontrol: önceki · çal/durdur · sonraki */}
      <div className="mt-4 grid grid-cols-[1fr_1.4fr_1fr] gap-3">
        <button onClick={() => gec(-1)} className="surus-dugme press" aria-label={en ? "previous" : "önceki"}>⏮</button>
        <button
          onClick={() => (calan ? onCal(calan) : liste[0] && onCal(liste[0].slug))}
          className="surus-dugme surus-ana press"
          style={{ background: renk }}
          aria-label={calan ? (en ? "stop" : "durdur") : (en ? "play" : "çal")}
        >
          {calan ? "⏸" : "▶"}
        </button>
        <button onClick={() => gec(1)} className="surus-dugme press" aria-label={en ? "next" : "sonraki"}>⏭</button>
      </div>

      {/* Hızlı geçiş: favoriler (yoksa en popülerler) */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {liste.slice(0, 6).map((s) => (
          <button
            key={s.slug}
            onClick={() => onCal(s.slug)}
            className="surus-istasyon press truncate"
            data-on={s.slug === calan ? "1" : "0"}
            style={s.slug === calan ? { borderColor: s.accentColor || "var(--glow)", color: "var(--fg)" } : undefined}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
