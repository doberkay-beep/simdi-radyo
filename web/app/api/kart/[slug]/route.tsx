import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSupabase } from "@/lib/supabase";
import { TUR_EPIGRAF, gununDizesi } from "@/lib/sozler";

// Paylaşılabilir kart — bir istasyon linki paylaşıldığında o an çalanı gösteren
// canlı görsel. İstasyon rengiyle boyanır. next/og ile PNG üretir.
export const runtime = "nodejs";
export const revalidate = 30;

const DEFAULT_ACCENT = "#c2683c";

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

// #rrggbb → çok koyu bir zemin tonu (istasyon renginden türetilmiş).
function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = Math.round(parseInt(h.slice(0, 2), 16) * amount);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * amount);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * amount);
  return `rgb(${r},${g},${b})`;
}

type Station = {
  id: number;
  name: string;
  city: string | null;
  frequency: string | null;
  accent_color: string | null;
  genre: string | null;
};

async function load(slug: string) {
  try {
    const supa = getSupabase();
    const { data: st } = await supa
      .from("stations")
      .select("id, name, city, frequency, accent_color, genre")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!st) return { station: null, track: null };
    const station = st as Station;
    const { data: np } = await supa
      .from("now_playing")
      .select("artist, title, raw_title")
      .eq("station_id", station.id)
      .maybeSingle();
    let track: string | null = null;
    if (np) {
      const a = (np.artist as string | null)?.trim() || null;
      const t = (np.title as string | null)?.trim() || null;
      track = a && t && a !== t ? `${a} — ${t}` : t || (np.raw_title as string | null) || null;
    }
    return { station, track };
  } catch {
    return { station: null, track: null };
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { station, track } = await load(slug);

  const [brandFont, readFont] = await Promise.all([
    readFile(join(process.cwd(), "assets/BricolageGrotesque-Bold.ttf")),
    readFile(join(process.cwd(), "assets/Lora-Italic.ttf")),
  ]);

  const name = station?.name ?? "ŞİMDİ";
  const accent = station?.accent_color || DEFAULT_ACCENT;
  const ink = readableOn(accent);
  const genre = station?.genre ?? null;
  const dize = (genre && TUR_EPIGRAF[genre]) || gununDizesi();
  const meta = [station?.frequency, station?.city].filter(Boolean).join(" · ");
  const nowLine = track ?? "canlı yayın";

  // Ekolayzer çubukları — sabit ama istasyon renginde.
  const bars = [120, 220, 300, 180, 260, 150, 230];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(150deg, ${darken(accent, 0.28)}, #08080a 62%)`,
          color: "#f4f4f6",
          padding: "72px 88px",
          fontFamily: "Bricolage",
        }}
      >
        {/* Üst: marka + istasyon künyesi */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 30,
                letterSpacing: 8,
                textTransform: "uppercase",
                color: accent,
                fontWeight: 700,
              }}
            >
              şimdi çalıyor
            </div>
            <div style={{ fontSize: 26, color: "#9a9aa2", marginTop: 8 }}>
              {meta || "canlı radyo"}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.5)})`,
              color: ink,
              fontSize: 52,
              fontWeight: 700,
            }}
          >
            {name.trim().charAt(0).toLocaleUpperCase("tr")}
          </div>
        </div>

        {/* Orta: çalan parça */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
          <div
            style={{
              fontSize: nowLine.length > 42 ? 68 : nowLine.length > 26 ? 88 : 108,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -2,
            }}
          >
            {nowLine}
          </div>
          <div style={{ fontSize: 40, color: "#c8c8d0", marginTop: 22 }}>{name}</div>
        </div>

        {/* Alt: dize + ekolayzer + adres */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 84 }}>
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 22,
                  height: (h / 300) * 84,
                  background: accent,
                  borderRadius: 11,
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontFamily: "Lora",
              fontStyle: "italic",
              fontSize: 30,
              color: "#b6b6be",
              marginTop: 26,
              maxWidth: 900,
            }}
          >
            “{dize}”
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>ŞİMDİ</div>
            <div style={{ fontSize: 30, color: "#9a9aa2" }}>necaliyor.co</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Bricolage", data: brandFont, weight: 700, style: "normal" },
        { name: "Lora", data: readFont, weight: 400, style: "italic" },
      ],
    },
  );
}
