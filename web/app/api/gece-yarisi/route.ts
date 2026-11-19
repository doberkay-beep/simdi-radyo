import { json } from "@/lib/json";
import { geceYarisi, istekCoz, bitti } from "@/lib/gece-yarisi";

export const dynamic = "force-dynamic";

// GET /api/gece-yarisi[?yil=2027 | ?tarih=YYYY-MM-DD]
// Her radyoda yerel 00:00'da çalan şarkı, gece yarısı anına göre gruplu. Gece boyunca
// sayfa dakikada bir buraya sorar; CDN önbelleği yükü tek isteğe indirir.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const { tarih, simdi } = istekCoz({ tarih: q.get("tarih"), yil: q.get("yil"), simdi: q.get("simdi") });
  const veri = await geceYarisi(tarih, simdi);
  const cache = bitti(veri) ? "public, s-maxage=86400, stale-while-revalidate=604800" : "public, s-maxage=60, stale-while-revalidate=60";
  return json(veri, { headers: { "Cache-Control": cache } });
}
