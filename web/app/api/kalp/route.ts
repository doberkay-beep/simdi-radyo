import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { rateLimit, istemciKimlik } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// GET /api/kalp → tüm istasyonların kalp toplamları { slug: toplam }.
export async function GET() {
  const supabase = getSupabase();
  try {
    const { data } = await supabase.from("station_hearts").select("slug, toplam");
    const kalpler: Record<string, number> = {};
    for (const r of data ?? []) kalpler[r.slug] = Number(r.toplam);
    return json(
      { kalpler },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } },
    );
  } catch {
    return json({ kalpler: {} });
  }
}

// POST /api/kalp  { slug }  → bir kalp ekle, yeni toplamı döndür.
export async function POST(request: Request) {
  // Dakikada en fazla 30 kalp / IP.
  if (!rateLimit(`kalp:${istemciKimlik(request)}`, 30, 60000)) {
    return json({ error: "çok hızlı" }, { status: 429 });
  }
  let slug = "";
  try {
    const body = await request.json();
    slug = String(body?.slug || "").trim();
  } catch {
    return json({ error: "gövde okunamadı" }, { status: 400 });
  }
  if (!slug || slug.length > 64) return json({ error: "geçersiz slug" }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("kalp_gonder", { p_slug: slug });
  if (error) return json({ error: error.message }, { status: 400 });
  return json({ slug, toplam: Number(data) });
}
