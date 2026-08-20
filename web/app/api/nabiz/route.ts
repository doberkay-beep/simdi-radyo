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
    .select("slug, name, accent_color, genre, band, now_playing(artist, title, raw_title)")
    .eq("is_active", true);

  type St = {
    slug: string;
    name: string;
    accent_color: string | null;
    genre: string | null;
    band: string | null;
    now_playing: unknown;
  };
  const groups = new Map<
    string,
    { title: string; artist: string | null; stations: { slug: string; name: string; accentColor: string | null }[] }
  >();
  // Tür dağılımı: ŞU AN parça çalan istasyonların türleri (Türkiye'nin ruh hali).
  const turSay = new Map<string, number>();
  let calanToplam = 0;
  for (const s of (nowData ?? []) as St[]) {
    const raw = s.now_playing;
    const np = (Array.isArray(raw) ? raw[0] : raw) as
      | { artist: string | null; title: string | null; raw_title: string | null }
      | null;
    if (!np) continue;
    const t = (np.title || np.raw_title || "").trim();
    if (t.length < 2) continue;
    if (s.genre) {
      turSay.set(s.genre, (turSay.get(s.genre) || 0) + 1);
      calanToplam++;
    }
    const key = low(t);
    if (!groups.has(key)) groups.set(key, { title: t, artist: np.artist, stations: [] });
    groups.get(key)!.stations.push({ slug: s.slug, name: s.name, accentColor: s.accent_color });
  }
  const moods = [...turSay.entries()]
    .map(([tur, adet]) => ({ tur, adet, oran: calanToplam ? adet / calanToplam : 0 }))
    .sort((a, b) => b.adet - a.adet);
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

  // (3) Ek analizler — en hareketli saat + yükselen (nabiz-plus.sql; yoksa boş).
  let hourly: { saat: number; adet: number }[] = [];
  let trend: { title: string; artist: string | null; son: number; onceki: number }[] = [];
  try {
    const [saat, yukselen] = await Promise.all([
      supabase.rpc("nabiz_saat", { gun: 7 }),
      supabase.rpc("nabiz_trend"),
    ]);
    if (Array.isArray(saat.data)) {
      hourly = saat.data.map((r: { saat: number; adet: number }) => ({
        saat: Number(r.saat),
        adet: Number(r.adet),
      }));
    }
    if (Array.isArray(yukselen.data)) {
      trend = yukselen.data.map((r: { title: string; artist: string | null; son: number; onceki: number }) => ({
        title: r.title,
        artist: r.artist,
        son: Number(r.son),
        onceki: Number(r.onceki),
      }));
    }
  } catch {
    // nabiz-plus.sql henüz çalıştırılmadıysa boş geç
  }

  return json(
    { simultaneous, todaySongs, todayArtists, moods, calanToplam, hourly, trend },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
