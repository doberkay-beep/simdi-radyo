import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { endeksAylari, type EndeksOzet } from "@/lib/endeks";

// GET /api/endeks — Radyo Endeksi: her ay için özet (mobil uygulama için).
// Ağır sorgu; CDN'de 1 saat önbellekli, böylece her cihaz veritabanına gitmez.
export const revalidate = 3600;

export async function GET() {
  const aylar = endeksAylari();
  const ozetler = await Promise.all(
    aylar.map(async (ay) => {
      try {
        const { data } = await getSupabase().rpc("endeks_ozet", { p_ay: ay });
        return (data as EndeksOzet | null) ?? null;
      } catch {
        return null;
      }
    }),
  );
  return json(
    { aylar: ozetler.filter(Boolean) },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
