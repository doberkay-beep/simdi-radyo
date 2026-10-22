import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { adDuzelt } from "@/lib/rapor";

// GET /api/sanatci?s=<slug> — sanatçı sayfası verisi (özet + trend + benzer sanatçılar), mobil uygulama için.
// Ağır RPC'ler; CDN'de 6 saat önbellekli (sitedeki /sanatci/[slug] sayfasıyla aynı tazelik).
export const dynamic = "force-dynamic";

type Sarki = { title: string; slug: string; kez: number };

// Bazı radyolar başlığı "Hatýran Yeter - Zakkum - Hatıran Yeter" diye (bozuk kodlama + sanatçı + doğru ad) gönderiyor.
const sade = (t: string) =>
  t.toLocaleLowerCase("tr").replace(/[ışğüöçâîûþýð]/g, (h) => ({ ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u", þ: "s", ý: "i", ð: "g" })[h] ?? h)
    .replace(/[^a-z0-9]+/g, " ").trim();
const KOD: Record<string, string> = { ý: "ı", Ý: "İ", þ: "ş", Þ: "Ş", ð: "ğ", Ð: "Ğ" };
function baslikDuzelt(title: string, ad: string): string {
  const p = title.split(" - ");
  if (p.length >= 3 && sade(p[1]) === sade(ad)) title = p.slice(2).join(" - ");
  else if (p.length === 2 && sade(p[0]) === sade(ad)) title = p[1];
  title = title.replace(/[ýÝþÞðÐ]/g, (h) => KOD[h]).trim();
  return title.charAt(0).toLocaleUpperCase("tr") + title.slice(1);
}

// Aynı şarkının yazım varyantlarını tek satırda topla (sitedeki sayfayla aynı kural).
function birlestir(liste: Sarki[], ad: string): Sarki[] {
  const g = new Map<string, Sarki & { enIyi: number }>();
  for (const ham of liste) {
    const s = { ...ham, title: baslikDuzelt(ham.title, ad) };
    const k = sade(s.title) || s.slug;
    const v = g.get(k);
    if (!v) g.set(k, { ...s, enIyi: s.kez });
    else {
      v.kez += s.kez;
      if (s.kez > v.enIyi) { v.title = s.title; v.slug = s.slug; v.enIyi = s.kez; }
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
  const sonlar = ((o?.sonlar as { title: string }[] | undefined) ?? []).map((x) => ({ ...x, title: baslikDuzelt(x.title, o!.ad) }));
  const temiz = o ? { ...o, ad: adDuzelt(o.ad), sarkilar: birlestir(o.sarkilar ?? [], o.ad), sonlar } : null;
  const b = ((benzer as { slug: string; ad: string; ortak: number }[]) ?? [])
    .filter((x) => x.slug && x.ad).map((x) => ({ ...x, ad: adDuzelt(x.ad) }));
  return json(
    { slug, ozet: temiz, trend, benzer: b },
    { headers: { "Cache-Control": temiz ? "public, s-maxage=21600, stale-while-revalidate=86400" : "public, s-maxage=600" } },
  );
}
