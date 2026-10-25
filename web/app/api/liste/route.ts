import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { ULKELER, ulkeIstasyonSluglari, type UlkeKodu } from "@/lib/ulkeler";

export const dynamic = "force-dynamic";

// GET /api/liste?a=gun|hafta[&q=sanatçı][&ulke=us|hepsi]
// nowby. LİSTESİ: plays arşivinden canlı sayım (liste-canli.sql fonksiyonları).
// ulke verilmezse ya da "tr" ise Türkiye listesi (eskisi gibi); başka ülke ya da "hepsi" ise
// Hetzner'deki liste_ulke (sunucu/arsiv/liste-ulke.sql).
export async function GET(request: Request) {
  const u = new URL(request.url);
  const aralik = u.searchParams.get("a") === "hafta" ? 7 : 1;
  const q = (u.searchParams.get("q") || "").trim().slice(0, 60);
  const sona = new Date();
  const bastan = new Date(sona.getTime() - aralik * 24 * 60 * 60 * 1000);

  const ulkeParam = (u.searchParams.get("ulke") || "tr").toLowerCase();
  const ulke = ulkeParam === "hepsi" ? "hepsi" : ulkeParam in ULKELER ? (ulkeParam as UlkeKodu) : "tr";

  const supabase = getSupabase();
  if (!q && ulke !== "tr") {
    const { data, error } = await supabase.rpc("liste_ulke", {
      bastan: bastan.toISOString(),
      sona: sona.toISOString(),
      ...(ulke === "hepsi" ? {} : { sluglar: ulkeIstasyonSluglari(ulke) }),
      adet: 50,
    });
    if (error) return json({ error: error.message }, { status: 500 });
    return json(
      { aralik, ulke, q: null, satirlar: data ?? [] },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } },
    );
  }
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
    { aralik, ulke: "tr", q: q || null, satirlar: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
  );
}
