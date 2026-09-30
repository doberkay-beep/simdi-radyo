"use client";

import { useState } from "react";

// 📣 Kart/rozet paylaşım paneli — sanatçı rozeti, istasyon rozeti, senkron
// kartı hepsi bunu kullanır. `taban` görsel rotasıdır (?boyut=post|story eklenir).
// Telefonda sistem paylaşımı (IG story'ye tek dokunuş), masaüstünde indirme,
// X intent ve metni kopyala.
export default function RozetPaylas({
  taban, dosyaAdi, etiket, baslik, aciklama, metin,
}: {
  taban: string;
  dosyaAdi: string;
  etiket: string;
  baslik: string;
  aciklama: string;
  metin: string;
}) {
  const [durum, setDurum] = useState("");
  const gorsel = (b: "post" | "story") => `${taban}?boyut=${b}`;

  const paylas = async (b: "post" | "story") => {
    setDurum("hazırlanıyor…");
    try {
      const blob = await fetch(gorsel(b)).then((r) => r.blob());
      const dosya = new File([blob], `${dosyaAdi}-${b}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (window.matchMedia("(max-width: 820px)").matches && nav.canShare?.({ files: [dosya] })) {
        await navigator.share({ files: [dosya], text: metin });
        setDurum("");
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = dosya.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setDurum("indirildi ✓");
    } catch (e) {
      setDurum((e as Error)?.name === "AbortError" ? "" : "olmadı, bir daha dene");
    }
  };

  const kopyala = async () => {
    try { await navigator.clipboard.writeText(metin); setDurum("metin kopyalandı ✓"); }
    catch { setDurum("kopyalanamadı"); }
  };

  return (
    <section className="mb-10 rounded-2xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--glow) 45%, var(--line-hi))", background: "color-mix(in srgb, var(--glow) 5%, var(--panel))" }}>
      <p className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--glow-hi)" }}>{etiket}</p>
      <h2 className="mt-1 text-lg font-bold">{baslik}</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{aciklama}</p>

      <div className="mt-4 flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gorsel("post")} alt={baslik} width={216} height={270} className="w-[132px] shrink-0 rounded-xl border sm:w-[180px]" style={{ borderColor: "var(--line-hi)" }} loading="lazy" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button onClick={() => paylas("story")} className="hap-marka press text-left">📲 story için paylaş</button>
          <button onClick={() => paylas("post")} className="hap press text-left">🖼 gönderi görseli</button>
          <a className="hap press text-left" href={`https://x.com/intent/post?text=${encodeURIComponent(metin)}`} target="_blank" rel="noopener noreferrer">
            𝕏 X&apos;te paylaş
          </a>
          <button onClick={kopyala} className="hap press text-left">🔗 metni kopyala</button>
          {durum && <p className="mono text-xs" style={{ color: "var(--muted)" }}>{durum}</p>}
        </div>
      </div>
    </section>
  );
}
