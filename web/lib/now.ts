import { getSupabase } from "./supabase";
import { temizMetin } from "./cop";

// Aktif istasyonlar + şu an çalan parça — /api/now ve ana sayfanın sunucu
// tarafı ilk yüklemesi aynı veriyi kullanır.
export async function aktifIstasyonlar() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stations")
    .select(
      "id, slug, name, city, frequency, accent_color, band, genre, homepage, now_playing(artist, title, raw_title, updated_at)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((s) => {
    // now_playing tekil ilişki; istemci bazen dizi, bazen nesne döndürür.
    const raw = s.now_playing as unknown;
    const np = (Array.isArray(raw) ? raw[0] : raw) as
      | { artist: string | null; title: string | null; raw_title: string | null; updated_at: string }
      | null
      | undefined;
    return {
      id: s.id as number,
      slug: s.slug as string,
      name: s.name as string,
      city: s.city as string | null,
      frequency: s.frequency as string | null,
      accentColor: s.accent_color as string | null,
      band: s.band as "tr" | "int" | "own",
      genre: (s.genre ?? null) as string | null,
      homepage: (s.homepage ?? null) as string | null,
      nowPlaying: np
        ? {
            artist: temizMetin(np.artist),
            title: temizMetin(np.title),
            rawTitle: temizMetin(np.raw_title),
            updatedAt: np.updated_at,
          }
        : null,
    };
  });
}
