import { getSupabase } from "@/lib/supabase";

// Ses akışı proxy'si. Sürekli akıştır — istek anında çalışır, cache'lenmez.
// EDGE runtime: Node serverless fonksiyonu ~10-60 sn sonra kesilirdi (yayın
// "arada duruyordu"); Edge, veri aktıkça uzun uzun akıtabilir.
export const runtime = "edge";
export const dynamic = "force-dynamic";

// GET /api/stream/[slug]
// Zorunlu: Türk istasyonlarının çoğu düz HTTP yayın yapıyor; HTTPS sayfaya
// doğrudan gömülemez (mixed content). Bu proxy akışı OLDUĞU GİBİ geçirir —
// içeriğe dokunmaz, reklam kesmez. (Not: params bu sürümde Promise.)
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("stations")
    .select("stream_url, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return new Response("sunucu hatası", { status: 500 });
  if (!data || !data.is_active) return new Response("istasyon bulunamadı", { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(data.stream_url, {
      headers: { "User-Agent": "Simdi/0.1", "Icy-MetaData": "0" },
      redirect: "follow",
      signal: request.signal, // istemci bağlantıyı kapatınca üst akışı da iptal et
    });
  } catch {
    return new Response("yayına ulaşılamadı", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("yayın hatası", { status: 502 });
  }

  // Akışı olduğu gibi geçir; sadece içerik türünü aktar.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
