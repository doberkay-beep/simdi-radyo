"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { senkronDinle, sonSenkron, type SenkronAn } from "@/lib/canli";

// ⚡ SENKRON BANDI — son bir saatte bir Senkron Anı yaşandıysa ana sayfada
// parlar; yeni an düştüğü saniye (Realtime) canlı belirir. Nadir olduğu için
// görünmediği zamanlar çoğunluktadır — göründüğünde olaydır.
export default function SenkronBandi() {
  const [an, setAn] = useState<SenkronAn | null>(null);
  const [taze, setTaze] = useState(false);

  useEffect(() => {
    sonSenkron(60).then(setAn).catch(() => {});
    return senkronDinle((yeni) => {
      setAn(yeni);
      setTaze(true);
      setTimeout(() => setTaze(false), 6000);
    });
  }, []);

  if (!an) return null;
  const dk = Math.max(0, Math.round((Date.now() - Date.parse(an.son)) / 60000));
  const ne = dk < 2 ? "ŞU AN" : `${dk} DK ÖNCE`;

  return (
    <Link href={`/senkron/${an.id}`} className={`ince-bant press ${taze ? "np-taze" : ""}`}>
      <span className="etiket">⚡ {an.sayi} RADYO<span className="hidden sm:inline"> AYNI ANDA</span></span>
      <span className="metin">
        <strong>{an.artist} — {an.title}</strong>{" "}
        <span style={{ color: "var(--muted)" }}>· {an.istasyonlar.map((s) => s.name).join(" · ")}</span>
      </span>
      <span className="mono shrink-0 text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>{ne} →</span>
    </Link>
  );
}
