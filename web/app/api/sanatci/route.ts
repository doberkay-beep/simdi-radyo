import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { adDuzelt } from "@/lib/rapor";

// GET /api/sanatci?s=<slug> — sanatçı sayfası verisi (özet + trend + benzer sanatçılar), mobil uygulama için.
// Ağır RPC'ler; CDN'de 6 saat önbellekli (sitedeki /sanatci/[slug] sayfasıyla aynı tazelik).
export const dynamic = "force-dynamic";

type Sarki = { title: string; slug: string; kez: number };

// Aynı şarkının yazım varyantlarını tek satırda topla (sitedeki sayfayla aynı kural).
function birlestir(liste: Sarki[]): Sarki[] {
  const g = new Map<string, Sarki & { enIyi: number }>();
  for (const s of liste) {
    const v = g.get(s.slug);
    if (!v) g.set(s.slug, { ...s, enIyi: s.kez });
    else {
      v.kez += s.kez;
      if (s.kez > v.enIyi) { v.title = s.title; v.enIyi = s.kez; }
    }
  }
  return [...g.values()].sort((a, b) => b.kez - a.kez).map(({ title, slug, kez }) => ({ title, slug, kez }));
}

export async function GET(request: Request) {
  const slug = (new URL(request.url).searchParams.get("s") || "").trim().slice(0, 120);
  if (!/^[a-z0-9-]+$/.test(slug)) return json({ error: "slug" }, { status: 400 });
  const supa = getSupabase();
  const [ozet, trend, benzer] = await Promise.all([
    supa.rpc("sanatci_ozet", { p_slug: slug }).then((r) => r.data ?? null, () => null),
    supa.rpc("sanatci_trend", { p_slug: slug }).then((r) => (r.error ? null : r.data ?? null), () => null),
    supa.rpc("sanatci_benzer", { p_slug: slug }).then((r) => (r.error ? [] : r.data ?? []), () => []),
  ]);
  const o = ozet as ({ ad: string; sarkilar?: Sarki[] } & Record<string, unknown>) | null;
  const temiz = o ? { ...o, ad: adDuzelt(o.ad), sarkilar: birlestir(o.sarkilar ?? []) } : null;
  const b = ((benzer as { slug: string; ad: string; ortak: number }[]) ?? [])
    .filter((x) => x.slug && x.ad).map((x) => ({ ...x, ad: adDuzelt(x.ad) }));
  return json(
    { slug, ozet: temiz, trend, benzer: b },
    { headers: { "Cache-Control": temiz ? "public, s-maxage=21600, stale-while-revalidate=86400" : "public, s-maxage=600" } },
  );
}
