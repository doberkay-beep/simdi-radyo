import { json } from "@/lib/json";
import { senkronDefteri, senkronRekoru } from "@/lib/senkron";

// GET /api/senkron — Senkron Defteri (son 40 an + rekor), mobil uygulama için. CDN'de 2 dk.
export const revalidate = 120;

export async function GET() {
  const [defter, rekor] = await Promise.all([senkronDefteri(40), senkronRekoru()]);
  return json({ defter, rekor }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
}
