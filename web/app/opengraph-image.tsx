import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Paylaşım görseli (WhatsApp/X/iMessage önizlemesi): film başlığı gibi, tek kelime.
export const alt = "nowby. — radyoda şu an ne çalıyor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [baslik, yazi] = await Promise.all([
    readFile(join(process.cwd(), "assets/BodoniModa-Regular.ttf")),
    readFile(join(process.cwd(), "assets/Newsreader-Italic.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0a0a0a",
          color: "#f5f3ef",
          fontFamily: "Baslik",
        }}
      >
        <div style={{ display: "flex", fontSize: 220, lineHeight: 1, letterSpacing: -6 }}>
          nowby<span style={{ color: "#e5382c" }}>.</span>
        </div>
        <div style={{ display: "flex", fontFamily: "Yazi", fontSize: 44, color: "#9b9a96", marginTop: 58 }}>
          Radyoda şu an ne çalıyor?
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Baslik", data: baslik, weight: 400, style: "normal" },
        { name: "Yazi", data: yazi, weight: 400, style: "normal" },
      ],
    },
  );
}
