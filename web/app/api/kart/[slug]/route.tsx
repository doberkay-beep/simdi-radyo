import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSupabase } from "@/lib/supabase";
import { TUR_EPIGRAF, gununDizesi } from "@/lib/sozler";

// Paylaşılabilir kart sistemi — bir istasyonun o an çalanını gösteren canlı
// görsel. Üç format: yatay (link önizleme), kare (IG post), story (IG story).
// İstasyon rengiyle boyanır, next/og ile PNG üretir.
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

// #rrggbb → koyulaştırılmış rgb (zemin türetmek için).
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
  homepage: string | null;
};

async function load(slug: string) {
  try {
    const supa = getSupabase();
    const { data: st } = await supa
      .from("stations")
      .select("id, name, city, frequency, accent_color, genre, homepage")
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

// İstasyon logosu (favicon) — best-effort, data URI'ye çevir. Olmazsa null.
async function logoDataUri(homepage: string | null): Promise<string | null> {
  if (!homepage) return null;
  try {
    const host = new URL(homepage).host;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${host}&sz=128`, {
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 120) return null; // boş/placeholder favicon'ı ele
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

// Türkiye saati "HH:MM".
function saatTR(): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(new Date());
  } catch {
    return "";
  }
}

type Fmt = "yatay" | "kare" | "story";

// Formata göre boyut + ölçek eşiği.
function layout(fmt: Fmt) {
  if (fmt === "kare") return { w: 1080, h: 1080, pad: 84, nowMax: 128, nowMid: 100, nowMin: 76 };
  if (fmt === "story") return { w: 1080, h: 1920, pad: 96, nowMax: 132, nowMid: 104, nowMin: 80 };
  return { w: 1200, h: 630, pad: 76, nowMax: 108, nowMid: 88, nowMin: 66 };
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const q = (url.searchParams.get("format") || "yatay").toLowerCase();
  const fmt: Fmt = q === "kare" || q === "story" ? (q as Fmt) : "yatay";
  const L = layout(fmt);

  const { station, track } = await load(slug);

  const [brandFont, readFont, logo] = await Promise.all([
    readFile(join(process.cwd(), "assets/BricolageGrotesque-Bold.ttf")),
    readFile(join(process.cwd(), "assets/Lora-Italic.ttf")),
    logoDataUri(station?.homepage ?? null),
  ]);

  const name = station?.name ?? "ŞİMDİ";
  const accent = station?.accent_color || DEFAULT_ACCENT;
  const ink = readableOn(accent);
  const genre = station?.genre ?? null;
  const dize = (genre && TUR_EPIGRAF[genre]) || gununDizesi();
  const meta = [station?.frequency, station?.city].filter(Boolean).join(" · ");
  const nowLine = track ?? "canlı yayın";
  const saat = saatTR();
  const nowSize = nowLine.length > 42 ? L.nowMin : nowLine.length > 26 ? L.nowMid : L.nowMax;

  // Ekolayzer çubukları — istasyon renginde.
  const bars = [120, 220, 300, 180, 260, 150, 230, 190];
  const eqH = fmt === "story" ? 120 : fmt === "kare" ? 100 : 84;
  const barW = fmt === "yatay" ? 22 : 26;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(150deg, ${darken(accent, 0.3)}, #08080a 60%)`,
          color: "#f4f4f6",
          padding: L.pad,
          fontFamily: "Bricolage",
        }}
      >
        {/* Doku: köşeden accent parıltısı + vignette (grain taklidi) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background: `radial-gradient(60% 45% at 82% 8%, ${accent}22, transparent 70%), radial-gradient(70% 60% at 50% 120%, #00000066, transparent)`,
          }}
        />

        {/* Üst: marka satırı + istasyon künyesi + logo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  fontSize: fmt === "yatay" ? 30 : 34,
                  letterSpacing: 8,
                  textTransform: "uppercase",
                  color: accent,
                  fontWeight: 700,
                }}
              >
                şimdi çalıyor
              </div>
              {saat && (
                <div
                  style={{
                    fontSize: fmt === "yatay" ? 22 : 24,
                    color: "#8a8a92",
                    padding: "2px 12px",
                    borderRadius: 999,
                    border: "1px solid #2a2a30",
                  }}
                >
                  {saat}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
              <div style={{ fontSize: fmt === "yatay" ? 26 : 30, color: "#9a9aa2" }}>
                {meta || "canlı radyo"}
              </div>
              {genre && (
                <div
                  style={{
                    fontSize: fmt === "yatay" ? 22 : 24,
                    color: ink,
                    background: accent,
                    padding: "3px 14px",
                    borderRadius: 999,
                    textTransform: "lowercase",
                  }}
                >
                  {genre}
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: fmt === "yatay" ? 96 : 112,
              height: fmt === "yatay" ? 96 : 112,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.5)})`,
              color: ink,
              fontSize: fmt === "yatay" ? 52 : 60,
              fontWeight: 700,
              overflow: "hidden",
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} width={fmt === "yatay" ? 60 : 72} height={fmt === "yatay" ? 60 : 72} alt="" />
            ) : (
              name.trim().charAt(0).toLocaleUpperCase("tr")
            )}
          </div>
        </div>

        {/* Orta: çalan parça */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 1, marginTop: 8 }}>
          <div style={{ fontSize: nowSize, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>
            {nowLine}
          </div>
          <div style={{ fontSize: fmt === "yatay" ? 40 : 48, color: "#c8c8d0", marginTop: 22 }}>
            {name}
          </div>
        </div>

        {/* Alt: ekolayzer + dize + imza */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: eqH }}>
            {bars.map((h, i) => (
              <div
                key={i}
                style={{ width: barW, height: (h / 300) * eqH, background: accent, borderRadius: barW / 2, opacity: 0.9 }}
              />
            ))}
          </div>
          <div
            style={{
              fontFamily: "Lora",
              fontStyle: "italic",
              fontSize: fmt === "yatay" ? 30 : 36,
              color: "#b6b6be",
              marginTop: 26,
              maxWidth: L.w - L.pad * 2,
            }}
          >
            {`“${dize}”`}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ fontSize: fmt === "yatay" ? 34 : 40, fontWeight: 700, letterSpacing: -1 }}>ŞİMDİ</div>
              <div style={{ fontSize: fmt === "yatay" ? 22 : 26, color: "#8a8a92", fontStyle: "italic", fontFamily: "Lora" }}>
                bir şairin frekansı
              </div>
            </div>
            <div style={{ fontSize: fmt === "yatay" ? 30 : 34, color: "#9a9aa2" }}>necaliyor.co</div>
          </div>
        </div>
      </div>
    ),
    {
      width: L.w,
      height: L.h,
      fonts: [
        { name: "Bricolage", data: brandFont, weight: 700, style: "normal" },
        { name: "Lora", data: readFont, weight: 400, style: "italic" },
      ],
    },
  );
}
