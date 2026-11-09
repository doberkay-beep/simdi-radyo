import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { izinliKume, uygulamaIstegi } from "@/lib/uygulama";

// GET /api/rekorlar — arşivin uç değerleri, mobil uygulama için. Ağır sorgu; CDN'de 1 saat.
export const dynamic = "force-dynamic"; // derlemede DB'ye gitmesin; CDN önbelleği Cache-Control ile

export async function GET(request: Request) {
  let rekorlar: unknown = null;
  try {
    const { data } = await getSupabase().rpc("rekorlar");
    rekorlar = data ?? null;
  } catch { /* boş */ }
  // Uygulama (1.0.2+): "sadık ilişki" bir radyonun adını taşır; izinli değilse gösterilmez.
  if (rekorlar && uygulamaIstegi(request)) {
    const r = rekorlar as Record<string, unknown> & { sadikIliski?: { istasyon?: string } | null };
    const { liste } = await izinliKume();
    if (r.sadikIliski && !liste.some((s) => s.name === r.sadikIliski?.istasyon)) rekorlar = { ...r, sadikIliski: null };
  }
  return json({ rekorlar }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
