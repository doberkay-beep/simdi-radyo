"use client";

import { useEffect, useState } from "react";
import { kasaKodu, kasaGeriYukle, kasaYedekle, kodGecerli } from "@/lib/kasa";

// 🔐 HAFIZA KODU — favoriler, müzik defteri ve takip listesi bu kodla
// sunucuda saklanır. Başka cihazda/tarayıcıda kodu gir, hepsi gelsin.
export default function KasaModal({ acik, kapat, dil }: { acik: boolean; kapat: () => void; dil: string }) {
  const en = dil === "en";
  const [kod, setKod] = useState("");
  const [girilen, setGirilen] = useState("");
  const [durum, setDurum] = useState<"" | "kopyalandi" | "yukleniyor" | "tamam" | "yok" | "hata">("");

  useEffect(() => {
    if (!acik) return;
    setKod(kasaKodu());
    setDurum("");
    kasaYedekle().catch(() => {});
  }, [acik]);

  if (!acik) return null;

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(kod);
    } catch {
      const t = document.createElement("textarea");
      t.value = kod;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setDurum("kopyalandi");
  };

  const yukle = async () => {
    setDurum("yukleniyor");
    const s = await kasaGeriYukle(girilen);
    setDurum(s);
    if (s === "tamam") setKod(kasaKodu());
  };

  const bicimli = kod ? `${kod.slice(0, 5)}-${kod.slice(5)}` : "…";

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-label={en ? "memory code" : "hafıza kodu"}>
      <button className="absolute inset-0" style={{ background: "color-mix(in srgb, #000 62%, transparent)" }} onClick={kapat} aria-label={en ? "close" : "kapat"} />
      <div className="menu-sayfa absolute inset-x-0 bottom-0 rounded-t-2xl p-5 pb-8 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
        <div className="mb-3 flex items-center justify-between">
          <span className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            🔐 {en ? "MEMORY CODE" : "HAFIZA KODU"}
          </span>
          <button onClick={kapat} className="press text-xl leading-none" aria-label={en ? "close" : "kapat"}>×</button>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {en
            ? "Your favorites, music journal and followed artists are backed up with this code. No sign-up: on another phone or browser, enter the code and everything comes back."
            : "Favorilerin, müzik defterin ve takip ettiğin sanatçılar bu kodla yedekleniyor. Üyelik yok: başka telefonda ya da tarayıcıda kodu gir, hepsi geri gelsin."}
        </p>

        <button
          onClick={kopyala}
          className="press mt-4 w-full rounded-2xl border py-4 text-center"
          style={{ borderColor: "color-mix(in srgb, var(--glow) 55%, var(--line-hi))", background: "color-mix(in srgb, var(--glow) 8%, var(--panel))" }}
          title={en ? "copy" : "kopyala"}
        >
          <span className="mono block text-2xl font-bold tracking-[0.18em]" style={{ color: "var(--glow-hi)" }}>{bicimli}</span>
          <span className="mono mt-1 block text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            {durum === "kopyalandi" ? (en ? "copied ✓ — keep it somewhere safe" : "kopyalandı ✓ — notlarına kaydet") : (en ? "tap to copy" : "kopyalamak için dokun")}
          </span>
        </button>

        <div className="mt-5">
          <label className="mono text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }} htmlFor="kasa-kod">
            {en ? "have a code from another device?" : "başka cihazdaki kodun mu var?"}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="kasa-kod"
              value={girilen}
              onChange={(e) => setGirilen(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 10))}
              placeholder="ABCDE-23456"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="mono min-w-0 flex-1 rounded-xl border bg-transparent px-3 py-2.5 text-base tracking-[0.14em]"
              style={{ borderColor: "var(--line-hi)", color: "var(--fg)" }}
            />
            <button onClick={yukle} disabled={!kodGecerli(girilen) || durum === "yukleniyor"} className="hap-marka press shrink-0">
              {durum === "yukleniyor" ? "…" : en ? "restore" : "getir"}
            </button>
          </div>
          {durum === "tamam" && (
            <p className="mt-2 text-sm font-semibold">🎉 {en ? "Restored — merged with what you had here." : "Geldi! Buradakilerle birleştirildi, hiçbir şey silinmedi."}</p>
          )}
          {durum === "yok" && <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{en ? "No memory found for that code." : "Bu koda ait bir hafıza bulunamadı."}</p>}
          {durum === "hata" && <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{en ? "Couldn't reach the vault, try again." : "Kasaya ulaşılamadı, birazdan yine dene."}</p>}
        </div>
      </div>
    </div>
  );
}
