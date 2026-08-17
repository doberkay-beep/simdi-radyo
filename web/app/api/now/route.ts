import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

// Canlı veri okur → istek anında çalışır. Cache'i CDN başlığıyla veriyoruz.
export const dynamic = "force-dynamic";

// GET /api/now — tüm aktif istasyonlar + şu an çalan parça. 10 sn cache.
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stations")
    .select(
      "slug, name, city, frequency, accent_color, band, now_playing(artist, title, raw_title, updated_at)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  const stations = (data ?? []).map((s) => {
    // now_playing tekil ilişki; istemci bazen dizi, bazen nesne döndürür.
    const raw = s.now_playing as unknown;
    const np = Array.isArray(raw) ? raw[0] : raw;
    return {
      slug: s.slug,
      name: s.name,
      city: s.city,
      frequency: s.frequency,
      accentColor: s.accent_color,
      band: s.band,
      nowPlaying: np
        ? {
            artist: np.artist,
            title: np.title,
            rawTitle: np.raw_title,
            updatedAt: np.updated_at,
          }
        : null,
    };
  });

  return json(
    { stations },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } },
  );
}
