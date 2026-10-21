import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

// GET /api/istasyon?s=<slug> — istasyon karnesi (son 7 gün), mobil uygulama için.
// CDN'de 15 dk önbellekli (sitedeki /radyo/[slug] sayfasıyla aynı tazelik).
// Benzer istasyonlar uygulamada türden hesaplanır (benzerler RPC'si ~36 sn sürüyor).
export const dynamic = "force-dynamic"; // CDN önbelleği Cache-Control ile (15 dk)

export async function GET(request: Request) {
  const slug = (new URL(request.url).searchParams.get("s") || "").trim().slice(0, 80);
  if (!/^[a-z0-9-]+$/.test(slug)) return json({ error: "slug" }, { status: 400 });
  const { data } = await getSupabase().rpc("istasyon_ozet", { p_slug: slug }).then((r) => r, () => ({ data: null }));
  return json({ slug, ozet: data ?? null }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
}
