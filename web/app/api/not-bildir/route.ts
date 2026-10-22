import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { rateLimit, istemciKimlik } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// POST /api/not-bildir  { id }  → kalp defteri notunu bildir. 3 bildirimde not gizlenir; her bildirim incelemeye düşer.
export async function POST(request: Request) {
  // Dakikada en fazla 10 bildirim / IP (toplu gizleme saldırısına karşı).
  if (!rateLimit(`not-bildir:${istemciKimlik(request)}`, 10, 60000)) {
    return json({ error: "çok hızlı — biraz bekle" }, { status: 429 });
  }
  let id = 0;
  try {
    id = Number((await request.json())?.id);
  } catch {
    return json({ error: "gövde okunamadı" }, { status: 400 });
  }
  if (!Number.isInteger(id) || id <= 0) return json({ error: "geçersiz not" }, { status: 400 });
  const { data, error } = await getSupabase().rpc("not_bildir", { p_id: id });
  if (error) return json({ error: error.message }, { status: 400 });
  return json({ ok: Boolean(data) });
}
