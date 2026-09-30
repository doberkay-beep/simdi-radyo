import { getSupabase } from "@/lib/supabase";

// AÇIK VERİ — Türkiye Radyo Endeksi'nin ham JSON'u. Gazeteci ve araştırmacılar
// için; CORS açık, CDN'de 1 saat taze kalır. Alıntı: "necaliyor.co Türkiye Radyo Endeksi".
export const revalidate = 3600;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "application/json; charset=utf-8",
};

export async function GET(_req: Request, ctx: { params: Promise<{ ay: string }> }) {
  const { ay } = await ctx.params;
  if (!/^\d{4}-\d{2}$/.test(ay)) {
    return new Response(JSON.stringify({ hata: "ay biçimi YYYY-AA olmalı" }), { status: 400, headers: CORS });
  }
  const { data, error } = await getSupabase().rpc("endeks_ozet", { p_ay: ay });
  if (error || !data) {
    return new Response(JSON.stringify({ hata: "bu ay için veri yok" }), { status: 404, headers: CORS });
  }
  return new Response(
    JSON.stringify({ kaynak: "necaliyor.co Türkiye Radyo Endeksi", iletisim: "do.berkay@icloud.com", ...data }, null, 1),
    { headers: CORS },
  );
}
