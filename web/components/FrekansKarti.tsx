"use client";

import { useEffect, useMemo, useState } from "react";
import { useDil } from "@/lib/i18n";
import { ROZETLER, rozetleriHesapla } from "@/lib/rozet";

// Frekans Kartın — bu tarayıcıdaki dinleme günlüğünden kişisel radyo karnesi:
// kişilik etiketi, tür dağılımı, en sadık istasyon; paylaşılabilir 1080×1920 kart.

type Gunluk = { s: string; t: number }[];
type IstasyonOzet = { slug: string; name: string; genre: string | null; accentColor: string | null };

function oku(): Gunluk {
  try {
    return JSON.parse(localStorage.getItem("dinlemeGunlugu") || "[]") as Gunluk;
  } catch {
    return [];
  }
}

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

export default function FrekansKarti({
  stations,
  onClose,
}: {
  stations: IstasyonOzet[];
  onClose: () => void;
}) {
  const { dil, t } = useDil();
  const en = dil === "en";
  const [kartUrl, setKartUrl] = useState<string | null>(null);
  // "hep" = tüm günlük, "ay" = ŞİMDİ Wrapped (bu ayın dinlemeleri)
  const [kip, setKip] = useState<"hep" | "ay">("hep");
  const kazanilan = useMemo(() => rozetleriHesapla(), []);
  const tumGunluk = useMemo(oku, []);
  const gunluk = useMemo(() => {
    if (kip === "hep") return tumGunluk;
    const simdi = new Date();
    return tumGunluk.filter((k) => {
      const d = new Date(k.t);
      return d.getMonth() === simdi.getMonth() && d.getFullYear() === simdi.getFullYear();
    });
  }, [tumGunluk, kip]);
  const ayAdi = useMemo(
    () => new Date().toLocaleDateString(en ? "en-US" : "tr-TR", { month: "long" }),
    [en],
  );

  const ozet = useMemo(() => {
    if (gunluk.length < 3) return null;
    const bySlug = new Map(stations.map((s) => [s.slug, s]));
    const istasyonSay = new Map<string, number>();
    const turSay = new Map<string, number>();
    let gece = 0;
    for (const k of gunluk) {
      istasyonSay.set(k.s, (istasyonSay.get(k.s) || 0) + 1);
      const st = bySlug.get(k.s);
      if (st?.genre) turSay.set(st.genre, (turSay.get(st.genre) || 0) + 1);
      const saat = new Date(k.t).getHours();
      if (saat >= 22 || saat < 6) gece += 1;
    }
    const enCok = [...istasyonSay.entries()].sort((a, b) => b[1] - a[1])[0];
    const turlar = [...turSay.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const toplamTur = [...turSay.values()].reduce((a, b) => a + b, 0) || 1;
    const geceOran = gece / gunluk.length;
    const sadakat = (enCok?.[1] || 0) / gunluk.length;
    const cesitlilik = istasyonSay.size;

    // Kişilik: kurallı, veriden — uydurma yok, hepsi sayının adlandırılması.
    let kisilik: string;
    if (geceOran > 0.45) kisilik = en ? "Night Listener" : "Gece Dinleyicisi";
    else if (sadakat > 0.5) kisilik = en ? "Loyal Frequency" : "Sadık Frekans";
    else if (cesitlilik >= 10) kisilik = en ? "Dial Wanderer" : "Kadran Gezgini";
    else kisilik = en ? "Curious Ear" : "Meraklı Kulak";

    const enCokIst = enCok ? bySlug.get(enCok[0]) : null;
    return {
      kisilik,
      toplam: gunluk.length,
      cesitlilik,
      geceOran,
      enCokIst,
      turlar: turlar.map(([ad, n]) => ({ ad, oran: n / toplamTur })),
      accent: enCokIst?.accentColor || "#E5402A",
    };
  }, [gunluk, stations, en]);

  useEffect(() => {
    if (!ozet) return;
    try {
      const c = document.createElement("canvas");
      c.width = 1080;
      c.height = 1920;
      const x = c.getContext("2d");
      if (!x) return;
      const g = x.createLinearGradient(0, 0, 0, 1920);
      g.addColorStop(0, "#151210");
      g.addColorStop(0.5, "#0a0908");
      g.addColorStop(1, "#050505");
      x.fillStyle = g;
      x.fillRect(0, 0, 1080, 1920);
      x.textAlign = "center";
      x.fillStyle = "#8a8a8a";
      x.font = "600 34px 'Instrument Sans', system-ui, sans-serif";
      const baslikMetni =
        kip === "ay"
          ? en
            ? `YOUR ${ayAdi.toUpperCase()} FREQUENCY`
            : `${ayAdi.toLocaleUpperCase("tr")} FREKANSIN`
          : en
            ? "YOUR FREQUENCY"
            : "SENİN FREKANSIN";
      x.fillText(baslikMetni.split("").join(" "), 540, 300);
      x.fillStyle = ozet.accent;
      x.font = "bold 96px 'Instrument Sans', system-ui, sans-serif";
      x.fillText(ozet.kisilik, 540, 430);
      x.fillStyle = "#FAFAFA";
      x.font = "400 40px 'Instrument Sans', system-ui, sans-serif";
      x.fillText(
        en
          ? `${ozet.toplam} listens · ${ozet.cesitlilik} stations`
          : `${ozet.toplam} dinleme · ${ozet.cesitlilik} istasyon`,
        540,
        520,
      );
      // Tür barları
      let y = 680;
      for (const tur of ozet.turlar) {
        x.textAlign = "left";
        x.fillStyle = "#FAFAFA";
        x.font = "600 40px 'Instrument Sans', system-ui, sans-serif";
        x.fillText(tur.ad, 140, y);
        x.fillStyle = "rgba(255,255,255,0.12)";
        x.fillRect(140, y + 24, 800, 20);
        x.fillStyle = ozet.accent;
        x.fillRect(140, y + 24, Math.max(40, 800 * tur.oran), 20);
        x.textAlign = "right";
        x.fillStyle = "#8a8a8a";
        x.fillText(`%${Math.round(tur.oran * 100)}`, 940, y);
        y += 130;
      }
      if (ozet.enCokIst) {
        x.textAlign = "center";
        x.fillStyle = "#8a8a8a";
        x.font = "600 32px 'Instrument Sans', system-ui, sans-serif";
        x.fillText(en ? "MOST LOYAL TO" : "EN SADIK OLDUĞUN İSTASYON", 540, y + 80);
        x.fillStyle = "#FAFAFA";
        x.font = "bold 72px 'Instrument Sans', system-ui, sans-serif";
        x.fillText(ozet.enCokIst.name, 540, y + 170);
      }
      if (ozet.geceOran > 0.25) {
        x.fillStyle = "#8a8a8a";
        x.font = "italic 400 38px Georgia, serif";
        x.fillText(
          en
            ? `${Math.round(ozet.geceOran * 100)}% of your listening happens after dark 🌙`
            : `Dinlemelerinin %${Math.round(ozet.geceOran * 100)}'i gece 🌙`,
          540,
          y + 300,
        );
      }
      x.fillStyle = ozet.accent;
      x.font = "bold 44px 'Instrument Sans', system-ui, sans-serif";
      x.fillText("ŞİMDİ", 540, 1720);
      x.fillStyle = "#8a8a8a";
      x.font = "500 34px 'Instrument Sans', system-ui, sans-serif";
      x.fillText("necaliyor.co", 540, 1780);
      setKartUrl(c.toDataURL("image/png"));
    } catch {
      // kart üretilemedi — modal yine metinle çalışır
    }
  }, [ozet, en, kip, ayAdi]);

  async function paylas() {
    if (!kartUrl) return;
    try {
      const blob = await (await fetch(kartUrl)).blob();
      const dosya = new File([blob], "frekansim.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [dosya] })) {
        await navigator.share({ files: [dosya] });
        return;
      }
    } catch {
      // paylaşım iptal/desteksiz — indirmeye düş
    }
    const a = document.createElement("a");
    a.href = kartUrl;
    a.download = "frekansim.png";
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label={t("frekans.baslik")}>
      <button aria-label="kapat" onClick={onClose} className="absolute inset-0 h-full w-full" style={{ background: "rgba(0,0,0,0.6)" }} />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-2xl border-t px-5 pb-10 pt-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
        style={{ background: "var(--bg)", borderColor: "var(--line)" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{t("frekans.baslik")}</span>
          <button onClick={onClose} className="press rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            {t("frekans.kapat")}
          </button>
        </div>
        {/* ŞİMDİ Wrapped — tümü / bu ay */}
        <div className="mb-3 inline-flex rounded-full border p-0.5 text-xs" style={{ borderColor: "var(--line)" }}>
          {(
            [
              ["hep", en ? "all time" : "tümü"],
              ["ay", en ? ayAdi.toLowerCase() : ayAdi.toLocaleLowerCase("tr")],
            ] as const
          ).map(([k, ad]) => (
            <button
              key={k}
              onClick={() => setKip(k)}
              className="rounded-full px-3 py-1 transition-colors"
              style={{
                background: kip === k ? "var(--fg)" : "transparent",
                color: kip === k ? "var(--bg)" : "var(--muted)",
              }}
            >
              {ad}
            </button>
          ))}
        </div>
        {!ozet ? (
          <p className="read text-sm" style={{ color: "var(--muted)" }}>
            {t("frekans.az")}
          </p>
        ) : (
          <>
            {kartUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kartUrl} alt={t("frekans.baslik")} className="w-full rounded-xl border" style={{ borderColor: "var(--line)" }} />
            )}
            <button
              onClick={paylas}
              className="press mt-4 w-full rounded-full px-6 py-3 text-base font-semibold"
              style={{ background: ozet.accent, color: readableOn(ozet.accent) }}
            >
              {t("frekans.paylas")}
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>
              {t("frekans.gizli")}
            </p>
          </>
        )}

        {/* Rozetler — dinleme başarımları */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            {t("rozet.baslik")} · {kazanilan.size}/{ROZETLER.length}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ROZETLER.map((r) => {
              const var_ = kazanilan.has(r.id);
              return (
                <div
                  key={r.id}
                  className="rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--line)", opacity: var_ ? 1 : 0.38 }}
                  title={en ? r.aciklama.en : r.aciklama.tr}
                >
                  <span className="text-base leading-none" aria-hidden>{var_ ? r.emoji : "🔒"}</span>
                  <p className="mt-1 text-xs font-semibold" style={{ color: "var(--fg)" }}>
                    {en ? r.ad.en : r.ad.tr}
                  </p>
                  <p className="text-[10px] leading-snug" style={{ color: "var(--muted)" }}>
                    {en ? r.aciklama.en : r.aciklama.tr}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
