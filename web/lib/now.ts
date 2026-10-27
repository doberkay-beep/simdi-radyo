import { getSupabase } from "./supabase";
import { temizMetin } from "./cop";
import { istasyonUlkesi } from "./ulkeler";

// Aktif istasyonlar + şu an çalan parça — /api/now ve ana sayfanın sunucu
// tarafı ilk yüklemesi aynı veriyi kullanır.
//
// 23 Eki: "şu an çalan" artık Hetzner'deki toplayıcının bellekten yazdığı anlık
// dosyadan gelir (birkaç saniye taze, veritabanına yük yok). Veritabanından yalnız
// istasyon listesi okunur, o da örnek başına 10 dakikada bir. Anlık dosyaya
// ulaşılamaz ya da bayatlarsa eski yola (now_playing) düşülür.

const ANLIK_URL = process.env.ANLIK_URL || "http://188.245.2.113/canli/now.json";
const LISTE_SURE_MS = 10 * 60_000;
const BAYAT_MS = 3 * 60_000;

type Istasyon = {
  id: number; slug: string; name: string; city: string | null; frequency: string | null;
  accentColor: string | null; band: "tr" | "int" | "own"; genre: string | null; homepage: string | null;
  appIzinli: boolean;
};
type Calan = { artist: string | null; title: string | null; rawTitle: string | null; updatedAt: string };

let listeOnbellek: { at: number; liste: Istasyon[] } | null = null;

async function istasyonListesi(): Promise<Istasyon[]> {
  if (listeOnbellek && Date.now() - listeOnbellek.at < LISTE_SURE_MS) return listeOnbellek.liste;
  const { data, error } = await getSupabase()
    .from("stations")
    .select("id, slug, name, city, frequency, accent_color, band, genre, homepage, app_izinli")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  const liste = (data ?? []).map((s) => ({
    id: s.id as number, slug: s.slug as string, name: s.name as string,
    city: s.city as string | null, frequency: s.frequency as string | null,
    accentColor: s.accent_color as string | null, band: s.band as "tr" | "int" | "own",
    genre: (s.genre ?? null) as string | null, homepage: (s.homepage ?? null) as string | null,
    appIzinli: s.app_izinli === true,
  }));
  listeOnbellek = { at: Date.now(), liste };
  return liste;
}

async function anlikDurum(): Promise<Record<string, Calan> | null> {
  try {
    const r = await fetch(ANLIK_URL, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!r.ok) return null;
    const y = (await r.json()) as { at?: string; stations?: Record<string, Calan> };
    if (!y.stations || !y.at || Date.now() - Date.parse(y.at) > BAYAT_MS) return null;
    return y.stations;
  } catch {
    return null;
  }
}

// uygulama: App Store uygulamaları yalnız yazılı izin veren radyoları görür (Apple 5.2.3,
// stations.app_izinli). Site tüm aktif radyoları gösterir.
export async function aktifIstasyonlar({ uygulama = false }: { uygulama?: boolean } = {}) {
  const [anlik, tumListe] = await Promise.all([anlikDurum(), istasyonListesi().catch(() => null)]);
  const liste = tumListe && uygulama ? tumListe.filter((s) => s.appIzinli) : tumListe;
  if (anlik && liste) {
    return liste.map(({ appIzinli: _, ...s }) => {
      const c = anlik[s.slug];
      return {
        ...s,
        // Uygulamalar ülkeyi buradan okur; yeni eklenen radyo için uygulama güncellemesi gerekmez.
        country: istasyonUlkesi(s.slug),
        nowPlaying: c
          ? { artist: temizMetin(c.artist), title: temizMetin(c.title), rawTitle: temizMetin(c.rawTitle), updatedAt: c.updatedAt }
          : null,
      };
    });
  }
  return veritabanindanIstasyonlar(uygulama);
}

// Yedek yol: istasyonlar ve now_playing doğrudan veritabanından.
async function veritabanindanIstasyonlar(uygulama: boolean) {
  const supabase = getSupabase();
  let sorgu = supabase
    .from("stations")
    .select(
      "id, slug, name, city, frequency, accent_color, band, genre, homepage, now_playing(artist, title, raw_title, updated_at)",
    )
    .eq("is_active", true);
  if (uygulama) sorgu = sorgu.eq("app_izinli", true);
  const { data, error } = await sorgu.order("sort_order", { ascending: true });

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
      country: istasyonUlkesi(s.slug as string),
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
