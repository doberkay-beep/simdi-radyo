import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

export const dynamic = "force-dynamic";

// GET /api/archive?date=YYYY-MM-DD&time=HH:MM
// Verilen ana en yakın kayıtlar: her istasyon için o anda (o an ≤) çalan parça.
// Tarih/saat Türkiye saati (UTC+3, DST yok) kabul edilir.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  let ts: string;
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: "tarih biçimi YYYY-MM-DD olmalı" }, { status: 400 });
    }
    const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
    ts = `${date}T${t}:00+03:00`;
    if (Number.isNaN(new Date(ts).getTime())) {
      return json({ error: "geçersiz tarih/saat" }, { status: 400 });
    }
  } else {
    ts = new Date().toISOString();
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("archive_at", { ts });
  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  type Row = {
    slug: string;
    name: string;
    accent_color: string | null;
    artist: string | null;
    title: string | null;
    raw_title: string | null;
    started_at: string;
  };
  const stations = ((data ?? []) as Row[]).map((r) => ({
    slug: r.slug,
    name: r.name,
    accentColor: r.accent_color,
    artist: r.artist,
    title: r.title,
    rawTitle: r.raw_title,
    startedAt: r.started_at,
  }));

  // Geçmiş bir an değişmez → uzun cache. "Şu an" için kısa.
  const cache = date ? "public, s-maxage=300" : "public, s-maxage=10";
  return json({ at: ts, stations }, { headers: { "Cache-Control": cache } });
}
