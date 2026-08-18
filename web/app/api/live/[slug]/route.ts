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

const low = (s: string) => s.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr");
const JUNK = new Set([
  "unknown", "n/a", "na", "-", "--", "...", "no title", "bilgi yok",
  "reklam", "reklamlar", "canlı yayın", "canli yayin", "live", "live stream",
  "default", "default title",
]);

// Ham başlığı temizle (worker'daki normalizeTitle'ın özeti). Çöpse "" döner.
function normalizeTitle(raw: string, stationName = ""): string {
  let s = (raw || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  s = s.replace(/^(now playing|şimdi çalıyor|çalan|nowplaying)\s*[:\-–]\s*/i, "").trim();
  if (!s) return "";
  const l = low(s);
  if (/^(https?:\/\/|www\.)\S+$/i.test(s)) return "";
  if (JUNK.has(l) || l.includes("adw_ad") || l.includes("advertisement")) return "";
  if (stationName && l === low(stationName)) return "";
  // Çift ayraçlı tekrar: "A - B - A - B" → "A - B".
  const parts = s.split(" - ");
  if (parts.length >= 2 && parts.length % 2 === 0) {
    const half = parts.length / 2;
    const a = parts.slice(0, half).join(" - ");
    if (low(a) === low(parts.slice(half).join(" - ")) && a) return a;
  }
  return s;
}

// GET /api/live/[slug] — istasyonun ŞU ANKİ çalan başlığını canlı çeker.
// Kullanıcı bir istasyonu çaldığında, dinlediğiyle yazının eşleşmesi için.
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("stations")
    .select("stream_url, is_active, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return json({ error: "sunucu hatası" }, { status: 500 });
  if (!data || !data.is_active) return json({ error: "istasyon bulunamadı" }, { status: 404 });

  const res = await probeIcy(data.stream_url, { timeout: 7000 });
  const headers = { "Cache-Control": "no-store" };

  if (res.status !== "ok" || !res.title) {
    return json({ live: null, reason: res.status }, { headers });
  }
  const clean = normalizeTitle(res.title, data.name);
  if (!clean) return json({ live: null, reason: "junk" }, { headers });
  const p = parseTitle(clean);
  return json({ live: { artist: p.artist, title: p.title, rawTitle: clean } }, { headers });
}
