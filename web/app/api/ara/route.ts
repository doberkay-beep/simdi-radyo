import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

export const dynamic = "force-dynamic";

// GET /api/ara?q=...  → arşivde (plays) parça/sanatçı araması.
// Eşleşen son kayıtlar + istasyon bilgisi (iki adımlı join; sağlam).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return json({ q, rows: [], toplam: 0 });

  const supabase = getSupabase();
  const like = `%${q.replace(/[%_]/g, "")}%`;

  const { data: plays, error } = await supabase
    .from("plays")
    .select("station_id, artist, title, raw_title, started_at")
    .or(`title.ilike.${like},artist.ilike.${like},raw_title.ilike.${like}`)
    .order("started_at", { ascending: false })
    .limit(80);

  if (error) return json({ error: error.message }, { status: 500 });

  const ids = [...new Set((plays ?? []).map((p) => p.station_id))];
  const istMap = new Map<number, { slug: string; name: string; accentColor: string | null }>();
  if (ids.length) {
    const { data: sts } = await supabase
      .from("stations")
      .select("id, slug, name, accent_color")
      .in("id", ids);
    for (const s of sts ?? []) istMap.set(s.id, { slug: s.slug, name: s.name, accentColor: s.accent_color });
  }

  const rows = (plays ?? []).map((p) => {
    const st = istMap.get(p.station_id);
    return {
      artist: p.artist,
      title: p.title || p.raw_title,
      startedAt: p.started_at,
      slug: st?.slug ?? null,
      name: st?.name ?? "—",
      accentColor: st?.accentColor ?? null,
    };
  });

  return json(
    { q, rows, toplam: rows.length },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
