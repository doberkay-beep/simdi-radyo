import { json } from "@/lib/json";

export const dynamic = "force-dynamic";

// GET /api/muzik-karti?artist=…&title=…
// Çalan parçanın müzik kimliği: kapak + albüm (iTunes), kısa biyografi
// (Wikipedia TR→EN), yaklaşan konserler (Bandsintown; nazlanırsa bağlantı).
// Hepsi anahtarsız/ücretsiz kaynaklar; CDN'de 1 gün önbellenir — çalan parça
// başına tek gerçek istek düşer.

const ZAMAN_ASIMI = 6000;

async function getir(url: string, headers?: Record<string, string>): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ZAMAN_ASIMI);
  try {
    return await fetch(url, { signal: ctrl.signal, headers });
  } finally {
    clearTimeout(t);
  }
}

type Kapak = { kapak: string | null; album: string | null; yil: string | null };
async function itunes(artist: string, title: string): Promise<Kapak> {
  const terim = encodeURIComponent(`${artist} ${title}`.trim());
  const r = await getir(`https://itunes.apple.com/search?term=${terim}&entity=song&limit=1&country=TR`);
  const d = await r.json();
  const s = d?.results?.[0];
  if (!s?.artworkUrl100) return { kapak: null, album: null, yil: null };
  return {
    kapak: String(s.artworkUrl100).replace("100x100", "600x600"),
    album: s.collectionName ?? null,
    yil: s.releaseDate ? String(s.releaseDate).slice(0, 4) : null,
  };
}

type Bio = { bio: string | null; wikiUrl: string | null; resim: string | null };
async function wikipedia(artist: string): Promise<Bio> {
  for (const dil of ["tr", "en"]) {
    try {
      const r = await getir(
        `https://${dil}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist)}`,
        { accept: "application/json" },
      );
      if (!r.ok) continue;
      const d = await r.json();
      if (d?.type === "disambiguation" || !d?.extract) continue;
      return {
        bio: String(d.extract).slice(0, 500),
        wikiUrl: d.content_urls?.desktop?.page ?? null,
        resim: d.thumbnail?.source ?? null,
      };
    } catch {
      // sıradaki dil
    }
  }
  return { bio: null, wikiUrl: null, resim: null };
}

type Konser = { tarih: string; mekan: string; sehir: string; url: string | null };
async function bandsintown(artist: string): Promise<Konser[]> {
  const r = await getir(
    `https://rest.bandsintown.com/artists/${encodeURIComponent(artist)}/events?app_id=necaliyor.co&date=upcoming`,
  );
  if (!r.ok) return [];
  const d = await r.json();
  if (!Array.isArray(d)) return [];
  return d.slice(0, 3).map((e) => ({
    tarih: String(e.datetime ?? "").slice(0, 10),
    mekan: e.venue?.name ?? "",
    sehir: [e.venue?.city, e.venue?.country].filter(Boolean).join(", "),
    url: e.offers?.[0]?.url ?? e.url ?? null,
  }));
}

export async function GET(request: Request) {
  const u = new URL(request.url);
  const artist = (u.searchParams.get("artist") || "").trim().slice(0, 120);
  const title = (u.searchParams.get("title") || "").trim().slice(0, 160);
  if (!artist) return json({ error: "artist gerekli" }, { status: 400 });

  const [kapakS, bioS, konserS] = await Promise.allSettled([
    itunes(artist, title),
    wikipedia(artist),
    bandsintown(artist),
  ]);
  const kapak = kapakS.status === "fulfilled" ? kapakS.value : { kapak: null, album: null, yil: null };
  const bio = bioS.status === "fulfilled" ? bioS.value : { bio: null, wikiUrl: null, resim: null };
  const konserler = konserS.status === "fulfilled" ? konserS.value : [];

  return json(
    {
      artist,
      title: title || null,
      ...kapak,
      ...bio,
      konserler,
      bandsintownUrl: `https://www.bandsintown.com/${encodeURIComponent(artist)}`,
    },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
