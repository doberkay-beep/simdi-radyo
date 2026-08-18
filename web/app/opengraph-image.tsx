import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Paylaşım görseli (WhatsApp/X/iMessage önizlemesi).
export const alt = "ŞİMDİ — radyoda şu an ne çalıyor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARS = [
  { h: 150, c: "#ff8a5b" },
  { h: 250, c: "#ffa257" },
  { h: 340, c: "#ffba52" },
  { h: 200, c: "#ffc94e" },
  { h: 290, c: "#ffd24d" },
];

export default async function Image() {
  const font = await readFile(join(process.cwd(), "assets/LiberationSans-Bold.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0a0b",
          color: "#ececee",
          padding: "0 96px",
          fontFamily: "Liberation Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 360 }}>
          {BARS.map((b, i) => (
            <div
              key={i}
              style={{ width: 46, height: b.h, background: b.c, borderRadius: 23 }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ fontSize: 128, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            ŞİMDİ
          </div>
          <div style={{ fontSize: 40, color: "#8a8a92", marginTop: 16 }}>
            radyoda şu an ne çalıyor
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Liberation Sans", data: font, weight: 700, style: "normal" }],
    },
  );
}
