import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { rateLimit, istemciKimlik } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// POST /api/geri-bildirim  { tur: "yanlis-sarki"|"istasyon-oner", slug?, mesaj }
export async function POST(request: Request) {
  if (!rateLimit(`gb:${istemciKimlik(request)}`, 6, 60000)) {
    return json({ error: "çok hızlı — biraz bekle" }, { status: 429 });
  }
  let tur = "";
  let slug = "";
  let mesaj = "";
  try {
    const body = await request.json();
    tur = String(body?.tur || "").trim();
    slug = String(body?.slug || "").trim();
    mesaj = String(body?.mesaj || "").trim();
  } catch {
    return json({ error: "gövde okunamadı" }, { status: 400 });
  }
  if (!["yanlis-sarki", "istasyon-oner"].includes(tur)) return json({ error: "geçersiz tür" }, { status: 400 });
  if (mesaj.length < 2 || mesaj.length > 300) return json({ error: "mesaj 2-300 karakter olmalı" }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase.rpc("geri_bildirim_birak", { p_tur: tur, p_slug: slug, p_mesaj: mesaj });
  if (error) return json({ error: error.message }, { status: 400 });
  return json({ ok: true });
}
