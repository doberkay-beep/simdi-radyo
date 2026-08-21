import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { rateLimit, istemciKimlik } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// POST /api/push/register  { token, platform, favoriler[] }
// Mobil uygulama açılışta push jetonunu buraya kaydeder.
export async function POST(request: Request) {
  if (!rateLimit(`push:${istemciKimlik(request)}`, 20, 60000)) {
    return json({ error: "çok hızlı" }, { status: 429 });
  }
  let token = "";
  let platform = "bilinmiyor";
  let favoriler: string[] = [];
  try {
    const body = await request.json();
    token = String(body?.token || "").trim();
    platform = String(body?.platform || "bilinmiyor").slice(0, 20);
    if (Array.isArray(body?.favoriler)) favoriler = body.favoriler.map((x: unknown) => String(x)).slice(0, 100);
  } catch {
    return json({ error: "gövde okunamadı" }, { status: 400 });
  }
  if (token.length < 8 || token.length > 256) return json({ error: "geçersiz jeton" }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase.rpc("push_kaydet", {
    p_token: token,
    p_platform: platform,
    p_favoriler: favoriler,
  });
  if (error) return json({ error: error.message }, { status: 400 });
  return json({ ok: true });
}
