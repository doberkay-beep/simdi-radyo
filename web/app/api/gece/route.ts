import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

// GET /api/gece — Gece 3 Listesi (02:00–05:00, son 7 gece), mobil uygulama için.
// CDN'de 30 dk önbellekli; her cihaz veritabanına gitmez.
export const dynamic = "force-dynamic"; // derlemede DB'ye gitmesin; CDN önbelleği Cache-Control ile

export async function GET() {
  let satirlar: unknown[] = [];
  try {
    const { data } = await getSupabase().rpc("gece_listesi", { adet: 20 });
    satirlar = (data as unknown[] | null) ?? [];
  } catch { /* boş liste */ }
  return json({ satirlar }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200" } });
}
