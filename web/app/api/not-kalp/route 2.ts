import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { rateLimit, istemciKimlik } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// POST /api/not-kalp  { id }  → nota bir kalp ekle, yeni toplamı döndür.
export async function POST(request: Request) {
  // Dakikada en fazla 30 not kalbi / IP.
  if (!rateLimit(`notkalp:${istemciKimlik(request)}`, 30, 60000)) {
    return json({ error: "çok hızlı" }, { status: 429 });
  }
  let id = 0;
  try {
    const body = await request.json();
    id = Number(body?.id);
  } catch {
    return json({ error: "gövde okunamadı" }, { status: 400 });
  }
  if (!Number.isInteger(id) || id <= 0) return json({ error: "geçersiz id" }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("not_kalp", { p_id: id });
  if (error) return json({ error: error.message }, { status: 400 });
  return json({ id, kalp: Number(data) });
}
