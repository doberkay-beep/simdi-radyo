import { getSupabase } from "@/lib/supabase";
import { probeIcy } from "@/lib/icy";
import { json } from "@/lib/json";

// Ham soket + canlı yoklama → Node runtime, istek anında, cache yok.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

// İlk " - " karakterinden böl (worker'daki kuralın aynısı).
function parseTitle(raw: string) {
  const r = (raw || "").trim();
  const i = r.indexOf(" - ");
  if (i === -1) return { artist: r, title: r };
  const a = r.slice(0, i).trim();
  const t = r.slice(i + 3).trim();
  if (!a || !t) return { artist: r, title: r };
  return { artist: a, title: t };
}

// GET /api/live/[slug] — istasyonun ŞU ANKİ çalan başlığını canlı çeker.
// Kullanıcı bir istasyonu çaldığında, dinlediğiyle yazının eşleşmesi için.
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("stations")
    .select("stream_url, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return json({ error: "sunucu hatası" }, { status: 500 });
  if (!data || !data.is_active) return json({ error: "istasyon bulunamadı" }, { status: 404 });

  const res = await probeIcy(data.stream_url, { timeout: 7000 });
  const headers = { "Cache-Control": "no-store" };

  if (res.status !== "ok" || !res.title) {
    return json({ live: null, reason: res.status }, { headers });
  }
  const p = parseTitle(res.title);
  return json({ live: { artist: p.artist, title: p.title, rawTitle: res.title } }, { headers });
}
