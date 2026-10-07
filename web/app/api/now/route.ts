import { json } from "@/lib/json";
import { aktifIstasyonlar } from "@/lib/now";

// Canlı veri okur → istek anında çalışır. Cache'i CDN başlığıyla veriyoruz.
export const dynamic = "force-dynamic";

// GET /api/now — tüm aktif istasyonlar + şu an çalan parça. 10 sn cache.
export async function GET() {
  try {
    const stations = await aktifIstasyonlar();
    return json(
      { stations },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } },
    );
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500 });
  }
}
