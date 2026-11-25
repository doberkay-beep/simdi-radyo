import { json } from "@/lib/json";
import { geceYarisi, istekCoz, bitti } from "@/lib/gece-yarisi";
import { yilinKareleri } from "@/lib/yilin-kareleri";
import { izinliKume, uygulamaIstegi } from "@/lib/uygulama";

export const dynamic = "force-dynamic";

// GET /api/gece-yarisi[?yil=2027 | ?tarih=YYYY-MM-DD][&uygulama=1]
// Her radyoda yerel 00:00'da çalan şarkı, gece yarısı anına göre gruplu. Gece boyunca
// sayfa dakikada bir buraya sorar; CDN önbelleği yükü tek isteğe indirir.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const { tarih, simdi } = istekCoz({ tarih: q.get("tarih"), yil: q.get("yil"), simdi: q.get("simdi") });
  // App Store uygulaması (?uygulama=1): yalnız yazılı izin veren radyolar; gruplar ve sayılar da onlara göre.
  const izinli = uygulamaIstegi(request) ? (await izinliKume()).sluglar : null;
  const [veri, { kareler }] = await Promise.all([geceYarisi(tarih, simdi, izinli), yilinKareleri()]);
  // "Yılın on iki karesi" (31 Ara 23:12–00:00, izleyicinin saati). Uygulamada izinsiz radyo hapta çalmaz: radyo null.
  const yk = kareler.map((k) => (izinli && !izinli.has(k.radyo) ? { ...k, radyo: null } : k));
  const cache = bitti(veri) ? "public, s-maxage=86400, stale-while-revalidate=604800" : "public, s-maxage=60, stale-while-revalidate=60";
  return json({ ...veri, kareler: yk }, { headers: { "Cache-Control": cache } });
}
