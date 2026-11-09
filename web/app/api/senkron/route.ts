import { json } from "@/lib/json";
import { senkronDefteri, senkronRekoru } from "@/lib/senkron";
import { izinliKume, uygulamaIstegi } from "@/lib/uygulama";

// GET /api/senkron — Senkron Defteri (son 40 an + rekor), mobil uygulama için. CDN'de 2 dk.
export const dynamic = "force-dynamic"; // derlemede DB'ye gitmesin; CDN önbelleği Cache-Control ile

type An = { istasyonlar: { slug: string }[]; sayi: number } & Record<string, unknown>;

export async function GET(request: Request) {
  let [defter, rekor] = (await Promise.all([senkronDefteri(40), senkronRekoru()])) as [An[], An | null];
  if (uygulamaIstegi(request)) {
    // Uygulama (1.0.2+): yalnız izinli radyolar; en az iki izinli radyonun buluştuğu anlar kalır.
    const { sluglar } = await izinliKume();
    const suz = (a: An | null): An | null => {
      if (!a) return null;
      const istasyonlar = a.istasyonlar.filter((i) => sluglar.has(i.slug));
      return istasyonlar.length >= 2 ? { ...a, istasyonlar, sayi: istasyonlar.length } : null;
    };
    defter = defter.map(suz).filter((a): a is An => a !== null);
    rekor = suz(rekor);
  }
  return json({ defter, rekor }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
}
