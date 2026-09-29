import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

export const dynamic = "force-dynamic";

// GET /api/liste?a=gun|hafta[&q=sanatçı]
// ŞİMDİ LİSTESİ: plays arşivinden canlı sayım (liste-canli.sql fonksiyonları).
export async function GET(request: Request) {
  const u = new URL(request.url);
  const aralik = u.searchParams.get("a") === "hafta" ? 7 : 1;
  const q = (u.searchParams.get("q") || "").trim().slice(0, 60);
  const sona = new Date();
  const bastan = new Date(sona.getTime() - aralik * 24 * 60 * 60 * 1000);

  const supabase = getSupabase();
  const { data, error } = q
    ? await supabase.rpc("sanatci_araligi", {
        q,
        bastan: bastan.toISOString(),
        sona: sona.toISOString(),
      })
    : await supabase.rpc("liste_araligi", {
        bastan: bastan.toISOString(),
        sona: sona.toISOString(),
        adet: 50,
      });

  if (error) return json({ error: error.message }, { status: 500 });
  return json(
    { aralik, q: q || null, satirlar: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
  );
}
