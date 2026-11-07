import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import { TUR_EPIGRAF, gununDizesi } from "@/lib/sozler";
import { fontlar, RENK, STORY_DOLGU } from "@/lib/kart-ortak";
import { parcaAdi } from "@/lib/cop";

// Paylaşılabilir kart sistemi — bir istasyonun o an çalanını gösteren canlı
// görsel. Üç format: yatay (link önizleme), kare (IG post), story (IG story).
// Siyah zemin, tek kızıl; next/og ile PNG üretir.
export const runtime = "nodejs";
export const revalidate = 30;

type Station = {
  id: number;
  name: string;
  city: string | null;
  frequency: string | null;
  genre: string | null;
};

async function load(slug: string) {
  try {
    const supa = getSupabase();
    const { data: st } = await supa
      .from("stations")
      .select("id, name, city, frequency, genre")
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
      const t = parcaAdi(np.title as string | null) || null;
      track = a && t && a !== t ? `${a} — ${t}` : t || (np.raw_title as string | null) || null;
    }
    return { station, track };
  } catch {
    return { station: null, track: null };
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

  const fonts = await fontlar();

  const name = station?.name ?? "nowby.";
  const genre = station?.genre ?? null;
  const dize = (genre && TUR_EPIGRAF[genre]) || gununDizesi();
  const meta = [station?.frequency, station?.city, genre].filter(Boolean).join(" · ");
  const nowLine = track ?? "Canlı yayın";
  const saat = saatTR();
  const nowSize = nowLine.length > 42 ? L.nowMin : nowLine.length > 26 ? L.nowMid : L.nowMax;
  const buyuk = fmt !== "yatay";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: RENK.zemin2,
          color: RENK.metin,
          padding: fmt === "story" ? STORY_DOLGU : L.pad,
          fontFamily: "Govde",
        }}
      >
        {/* Üst: künye */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: buyuk ? 34 : 30 }}>
          <div style={{ display: "flex", color: RENK.kor }}>Şimdi çalıyor{saat ? ` · ${saat}` : ""}</div>
          <div style={{ display: "flex", color: RENK.soluk }}>{meta || "canlı radyo"}</div>
        </div>

        {/* Orta: çalan parça ve radyo */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Baslik", fontSize: nowSize, lineHeight: 1.04, letterSpacing: -2 }}>
            {nowLine}
          </div>
          <div style={{ display: "flex", fontSize: buyuk ? 48 : 40, color: RENK.soluk, marginTop: 22 }}>
            {name}
          </div>
        </div>

        {/* Alt: dize ve imza */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: buyuk ? 36 : 28, color: RENK.soluk, maxWidth: L.w - L.pad * 2 }}>
            {`“${dize}”`}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: buyuk ? 28 : 18 }}>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: buyuk ? 44 : 36 }}>
              nowby<span style={{ color: RENK.kor }}>.</span>
            </div>
            <div style={{ display: "flex", fontSize: buyuk ? 32 : 28, color: RENK.soluk }}>nowby.co</div>
          </div>
        </div>
      </div>
    ),
    { width: L.w, height: L.h, fonts },
  );
}
