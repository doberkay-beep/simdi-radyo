import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

// GET /api/rekorlar — arşivin uç değerleri, mobil uygulama için. Ağır sorgu; CDN'de 1 saat.
export const dynamic = "force-dynamic"; // derlemede DB'ye gitmesin; CDN önbelleği Cache-Control ile

export async function GET() {
  let rekorlar: unknown = null;
  try {
    const { data } = await getSupabase().rpc("rekorlar");
    rekorlar = data ?? null;
  } catch { /* boş */ }
  return json({ rekorlar }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
