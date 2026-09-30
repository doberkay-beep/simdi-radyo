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
    <Link
      href={`/senkron/${an.id}`}
      className={`senkron-bant press mb-4 block rounded-2xl border px-4 py-3 ${taze ? "np-taze" : ""}`}
    >
      <span className="mono block text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--glow-hi)" }}>
        ⚡ SENKRON ANI · {ne} · {an.sayi} RADYO AYNI ANDA
      </span>
      <span className="mt-1 block truncate text-[15px] font-semibold">
        {an.artist} — {an.title}
      </span>
      <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--muted)" }}>
        {an.istasyonlar.map((s) => s.name).join(" · ")} — birbirinden habersiz, aynı şarkı. kartı gör →
      </span>
    </Link>
  );
}
