import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

// GET /api/nabiz — Radyo Nabzı.
// (1) ŞU AN: aynı parçayı birden fazla istasyon çalıyor mu (now_playing'den).
// (2) SON 24 SAAT: en çok çalan parça/sanatçı (arşiv RPC'lerinden — nabiz.sql).
export const dynamic = "force-dynamic";

const low = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

export async function GET() {
  const supabase = getSupabase();

  // (1) Şu an çalanlar → eşzamanlılık.
  const { data: nowData } = await supabase
    .from("stations")
    .select("slug, name, accent_color, now_playing(artist, title, raw_title)")
    .eq("is_active", true);

  type St = {
    slug: string;
    name: string;
    accent_color: string | null;
    now_playing: unknown;
  };
  const groups = new Map<
    string,
    { title: string; artist: string | null; stations: { slug: string; name: string; accentColor: string | null }[] }
  >();
  for (const s of (nowData ?? []) as St[]) {
    const raw = s.now_playing;
    const np = (Array.isArray(raw) ? raw[0] : raw) as
      | { artist: string | null; title: string | null; raw_title: string | null }
      | null;
    if (!np) continue;
    const t = (np.title || np.raw_title || "").trim();
    if (t.length < 2) continue;
    const key = low(t);
    if (!groups.has(key)) groups.set(key, { title: t, artist: np.artist, stations: [] });
    groups.get(key)!.stations.push({ slug: s.slug, name: s.name, accentColor: s.accent_color });
  }
  const simultaneous = [...groups.values()]
    .filter((g) => g.stations.length >= 2)
    .sort((a, b) => b.stations.length - a.stations.length)
    .slice(0, 12);

  // (2) Son 24 saat — arşiv RPC'leri (yoksa sessizce boş).
  let todaySongs: { title: string; artist: string | null; adet: number }[] = [];
  let todayArtists: { artist: string; adet: number }[] = [];
  try {
    const [songs, artists] = await Promise.all([
      supabase.rpc("nabiz_top", { saat: 24 }),
      supabase.rpc("nabiz_artists", { saat: 24 }),
    ]);
    if (Array.isArray(songs.data)) {
      todaySongs = songs.data.map((r: { title: string; artist: string | null; adet: number }) => ({
        title: r.title,
        artist: r.artist,
        adet: Number(r.adet),
      }));
    }
    if (Array.isArray(artists.data)) {
      todayArtists = artists.data.map((r: { artist: string; adet: number }) => ({
        artist: r.artist,
        adet: Number(r.adet),
      }));
    }
  } catch {
    // nabiz.sql henüz çalıştırılmadıysa boş geç
  }

  return json(
    { simultaneous, todaySongs, todayArtists },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
