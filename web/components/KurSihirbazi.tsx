"use client";

import { useEffect, useState } from "react";

// 📲 KUR SİHİRBAZI — ŞİMDİ'yi uygulama gibi ana ekrana kurdurur.
// Android/Chrome: yakalanan beforeinstallprompt ile TEK dokunuş gerçek kurulum.
// iOS Safari: sistem izin vermez — iki adımlı resimli tarif gösterilir.
// Zaten kurulu (standalone) açılmışsa hiç görünmez.

type KurulumOlayi = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let yakalanan: KurulumOlayi | null = null;

// Modül yüklenir yüklenmez dinle — olay React mount'undan önce ateşlenebilir.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    yakalanan = e as KurulumOlayi;
  });
}

export function kuruluMu(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function KurSihirbazi({ acik, kapat, dil }: { acik: boolean; kapat: () => void; dil: string }) {
  const [ios, setIos] = useState(false);
  const [sonuc, setSonuc] = useState<"" | "kuruldu" | "vazgecti">("");
  const en = dil === "en";

  useEffect(() => {
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

  if (!acik) return null;

  const dogrudanKur = async () => {
    if (!yakalanan) return;
    await yakalanan.prompt();
    const { outcome } = await yakalanan.userChoice;
    yakalanan = null;
    setSonuc(outcome === "accepted" ? "kuruldu" : "vazgecti");
  };

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-label={en ? "install the app" : "uygulamayı kur"}>
      <button
        className="absolute inset-0"
        style={{ background: "color-mix(in srgb, #000 62%, transparent)" }}
        onClick={kapat}
        aria-label={en ? "close" : "kapat"}
      />
      <div className="menu-sayfa absolute inset-x-0 bottom-0 rounded-t-2xl p-5 pb-8 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[420px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border" >
        <div className="mb-3 flex items-center justify-between">
          <span className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            📲 {en ? "INSTALL ŞİMDİ" : "ŞİMDİ'Yİ KUR"}
          </span>
          <button onClick={kapat} className="press text-xl leading-none" aria-label={en ? "close" : "kapat"}>×</button>
        </div>

        {sonuc === "kuruldu" ? (
          <p className="text-base font-semibold">
            🎉 {en ? "Installed! ŞİMDİ now lives on your home screen." : "Kuruldu! ŞİMDİ artık ana ekranında yaşıyor."}
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {en
                ? "App store? No need. ŞİMDİ installs from the browser: full screen, its own icon, and artist radar notifications work properly."
                : "Mağaza yok, indirme yok. ŞİMDİ tarayıcıdan kurulur: tam ekran açılır, kendi simgesi olur, Sanatçı Radarı bildirimleri de tam çalışır."}
            </p>

            {ios ? (
              <ol className="mt-4 grid gap-2">
                <li className="menu-kalem">
                  <span className="mono text-sm font-bold" style={{ color: "var(--glow-hi)" }}>1</span>
                  {en ? <>Tap the <strong>Share</strong> button below (the square with ↑)</> : <>Alttaki <strong>Paylaş</strong> düğmesine dokun (↑ oklu kare)</>}
                </li>
                <li className="menu-kalem">
                  <span className="mono text-sm font-bold" style={{ color: "var(--glow-hi)" }}>2</span>
                  {en ? <>Choose <strong>&quot;Add to Home Screen&quot;</strong></> : <><strong>&quot;Ana Ekrana Ekle&quot;</strong>yi seç — bu kadar</>}
                </li>
              </ol>
            ) : yakalanan ? (
              <button onClick={dogrudanKur} className="hap-marka press mt-4 w-full text-center">
                {en ? "Install now" : "şimdi kur"}
              </button>
            ) : (
              <p className="menu-kalem mt-4">
                {en
                  ? "In Chrome: tap ⋮ menu → \"Add to Home screen\" (on desktop, the install icon at the end of the address bar)."
                  : "Chrome'da: ⋮ menü → \"Ana ekrana ekle\" (masaüstünde adres çubuğunun sonundaki kur simgesi)."}
              </p>
            )}
            {sonuc === "vazgecti" && (
              <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
                {en ? "Maybe later — this door stays in the menu." : "Olsun, kapı menüde durmaya devam ediyor."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
