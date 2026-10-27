import { json } from "@/lib/json";
import { aktifIstasyonlar } from "@/lib/now";

// Canlı veri okur → istek anında çalışır. Cache'i CDN başlığıyla veriyoruz.
export const dynamic = "force-dynamic";

// GET /api/now — tüm aktif istasyonlar + şu an çalan parça. "Şu an çalan" Hetzner'deki anlık dosyadan (lib/now), 3 sn cache.
// ?uygulama=1 — App Store uygulamaları: yalnız izinli radyolar (sorgu dizesi CDN önbellek anahtarına dahil).
export async function GET(req: Request) {
  try {
    const uygulama = new URL(req.url).searchParams.get("uygulama") === "1";
    const stations = await aktifIstasyonlar({ uygulama });
    return json(
      { stations },
      { headers: { "Cache-Control": "public, s-maxage=3, stale-while-revalidate=5" } },
    );
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500 });
  }
}
