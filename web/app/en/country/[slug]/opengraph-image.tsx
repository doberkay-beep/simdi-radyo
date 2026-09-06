import { ImageResponse } from "next/og";
import { ULKELER, ULKE_SLUG_EN, bayrakEmoji, ulkeIstasyonSluglari } from "@/lib/ulkeler";

// Country share card (EN) — flag + title + station count.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Country radio — ŞİMDİ";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kod = ULKE_SLUG_EN[slug];
  const u = kod ? ULKELER[kod] : null;
  const baslik = !u ? "World Atlas" : kod === "www" ? "Internet-only Radio" : `${u.en} Radio`;
  const adet = kod ? ulkeIstasyonSluglari(kod).length : 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%", width: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", background: "#050505", color: "#fafafa",
          padding: "64px 80px", fontFamily: "sans-serif",
          backgroundImage: "radial-gradient(110% 60% at 50% -14%, rgba(255,255,255,0.09), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>ŞİMDİ</div>
          <div style={{ display: "flex", fontSize: 24, color: "#8f8f96" }}>necaliyor.co</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 120, lineHeight: 1 }}>{kod ? bayrakEmoji(kod) : "🌍"}</div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>{baslik}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, color: "#8f8f96" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#3ddc84" }} />
            {adet > 0 ? `${adet} stations · live · now playing` : "live · now playing"}
          </div>
          <div style={{ display: "flex", color: "#fafafa" }}>listen →</div>
        </div>
      </div>
    ),
    { ...size, emoji: "twemoji" }
  );
}
