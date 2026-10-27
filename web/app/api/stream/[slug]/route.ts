import { getSupabase } from "@/lib/supabase";

// Ses akışı yönlendiricisi — istek anında çalışır, cache'lenmez.
export const runtime = "edge";
export const dynamic = "force-dynamic";

// GET /api/stream/[slug] — yalnız yönlendirir: dinleyici radyonun resmî https
// yayınına 302 ile gider. Aktarma (proxy) 27 Eki 2026'da kaldırıldı. (params bu sürümde Promise.)
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

  // ?meta=1 — istemci oynatıcıya kaynağın türünü söyler (HLS ise hls.js devreye girer).
  // Ses gövdesi dönmez; anlık cevaptır, CPU maliyeti yok denecek kadar azdır.
  if (new URL(request.url).searchParams.get("meta") === "1") {
    const https = typeof data.stream_url === "string" && data.stream_url.startsWith("https://");
    return Response.json(
      {
        hls: typeof data.stream_url === "string" && /\.m3u8(\?|$)/.test(data.stream_url),
        url: https ? data.stream_url : `/api/stream/${slug}`,
      },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  }

  // HTTPS yayınlar sayfaya doğrudan gömülebilir (mixed content yok): proxy'lemek
  // yerine yönlendir. Dinleme süresi boyunca fonksiyon açık kalmaz.
  if (typeof data.stream_url === "string" && data.stream_url.startsWith("https://")) {
    // Response.redirect immutable başlık döndürür; Next bazı yollarda başlığa
    // dokunmaya kalkınca TypeError atıyor — elle kurulan 302 her yerde çalışır.
    return new Response(null, { status: 302, headers: { Location: data.stream_url } });
  }

  // 27 Eki 2026: nowby yayın AKTARMAZ (hak sahipleri notu, Funky Corner koşulu).
  // Düz HTTP yayın katalogda olmamalı; olursa çalınmaz, sunucudan geçirilmez.
  return new Response("bu radyonun güvenli (https) resmî yayını yok; nowby yayın aktarmaz", { status: 410 });
}
