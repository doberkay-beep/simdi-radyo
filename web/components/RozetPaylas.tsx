"use client";

import { useState } from "react";
import { useDil } from "@/lib/i18n";

// Kart/rozet paylaşım paneli — sanatçı rozeti, istasyon rozeti, senkron
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
  const en = useDil().dil === "en";
  const gorsel = (b: "post" | "story") => `${taban}?boyut=${b}`;

  const paylas = async (b: "post" | "story") => {
    setDurum(en ? "preparing…" : "hazırlanıyor…");
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
      setDurum(en ? "downloaded ✓" : "indirildi ✓");
    } catch (e) {
      setDurum((e as Error)?.name === "AbortError" ? "" : en ? "that didn't work, try again" : "olmadı, bir daha dene");
    }
  };

  const kopyala = async () => {
    try { await navigator.clipboard.writeText(metin); setDurum(en ? "text copied ✓" : "metin kopyalandı ✓"); }
    catch { setDurum(en ? "couldn't copy" : "kopyalanamadı"); }
  };

  return (
    <section className="rozet-paylas">
      <p className="rozet-etiket">{etiket}</p>
      <h2 className="rozet-baslik">{baslik}</h2>
      <p className="rozet-aciklama">{aciklama}</p>

      <div className="rozet-govde">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gorsel("post")} alt={baslik} width={216} height={270} loading="lazy" />
        <div className="rozet-dugmeler">
          <button onClick={() => paylas("story")}>{en ? "share to story" : "story için paylaş"}</button>
          <button onClick={() => paylas("post")}>{en ? "post image" : "gönderi görseli"}</button>
          <a href={`https://x.com/intent/post?text=${encodeURIComponent(metin)}`} target="_blank" rel="noopener noreferrer">{en ? "share on X" : "X'te paylaş"}</a>
          <button onClick={kopyala}>{en ? "copy text" : "metni kopyala"}</button>
          {durum && <p>{durum}</p>}
        </div>
      </div>
    </section>
  );
}
