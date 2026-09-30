"use client";

import { useEffect, useState } from "react";

/* Gömülebilir ŞİMDİ LİSTESİ rozeti — haftanın en çok çalan 5 şarkısı, canlı.
   ?boy=genis → 728×90 yatay (ilk 3). Varsayılan: 300×250 dikey kart.
   Her gömme necaliyor.co/liste'ye gerçek bağlantı taşır. */

type Satir = { artist: string; title: string; kez: number };

export default function EmbedListe({ boy }: { boy: "kart" | "genis" }) {
  const [satirlar, setSatirlar] = useState<Satir[]>([]);

  useEffect(() => {
    const yukle = () =>
      fetch("/api/liste?a=hafta", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setSatirlar((d.satirlar ?? []).slice(0, boy === "genis" ? 3 : 5)))
        .catch(() => {});
    yukle();
    const id = setInterval(yukle, 180_000);
    return () => clearInterval(id);
  }, [boy]);

  const govde = {
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    background: "linear-gradient(180deg, #160b12, #0a0508)",
    color: "#f2e6da",
    border: "1px solid #3a1d18",
    borderRadius: 12,
    overflow: "hidden",
  } as const;

  if (boy === "genis") {
    return (
      <a href="https://necaliyor.co/liste" target="_blank" rel="noopener" style={{ textDecoration: "none" }}>
        <div style={{ ...govde, width: 728, height: 90, display: "flex", alignItems: "center", gap: 14, padding: "0 16px" }}>
          <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.12em", color: "#ff9b76", whiteSpace: "nowrap" }}>
            ŞİMDİ<br />LİSTESİ
          </div>
          <div style={{ display: "flex", gap: 18, minWidth: 0, flex: 1 }}>
            {satirlar.map((s, i) => (
              <div key={i} style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {i + 1}. {s.title}
                </div>
                <div style={{ fontSize: 11, color: "#b0938a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.artist}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#8d6f63", whiteSpace: "nowrap" }}>canlı · necaliyor.co</div>
        </div>
      </a>
    );
  }

  return (
    <a href="https://necaliyor.co/liste" target="_blank" rel="noopener" style={{ textDecoration: "none" }}>
      <div style={{ ...govde, width: 300, height: 250, padding: "12px 14px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.08em", color: "#ff9b76" }}>ŞİMDİ LİSTESİ</span>
          <span style={{ fontSize: 10, color: "#8d6f63" }}>bu hafta · canlı</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {satirlar.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: i < 3 ? "#ff9b76" : "#8d6f63", width: 14 }}>{i + 1}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.title}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "#b0938a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.artist} · {s.kez} kez
                </span>
              </span>
            </div>
          ))}
          {satirlar.length === 0 && <span style={{ fontSize: 12, color: "#8d6f63" }}>liste ısınıyor…</span>}
        </div>
        <div style={{ fontSize: 10, color: "#8d6f63", marginTop: 6 }}>Türkiye radyolarının gerçek sayımı → necaliyor.co/liste</div>
      </div>
    </a>
  );
}
