import { json } from "@/lib/json";
import { buHafta, gecerliHafta, haftalar, haftaEtiketi, raporGetir } from "@/lib/rapor";

// GET /api/rapor[?h=YYYY-MM-DD] — Haftalık Rapor (mobil uygulama için).
// Ağır sorgu; CDN'de 1 saat önbellekli.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const istenen = new URL(request.url).searchParams.get("h") ?? "";
  const h = gecerliHafta(istenen) ? istenen : buHafta();
  const rapor = await raporGetir(h);
  return json(
    { hafta: h, etiket: haftaEtiketi(h), haftalar: haftalar().slice(0, 12), rapor },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
