import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";
import { rateLimit, istemciKimlik } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// GET /api/not?slug=...  → o istasyonun son anıları (yoksa genel son anılar).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") || "").trim();
  const supabase = getSupabase();
  try {
    // kalp kolonu migrasyonu (not-kalp.sql) çalışana dek eski şemayla da ayakta kal.
    const sec = async (kolonlar: string) => {
      let q = supabase
        .from("station_notes")
        .select(kolonlar)
        .order("created_at", { ascending: false })
        .limit(20);
      if (slug) q = q.eq("slug", slug);
      return q;
    };
    let { data, error } = await sec("id, slug, not_text, created_at, kalp");
    if (error) ({ data } = await sec("id, slug, not_text, created_at"));
    const notlar = ((data ?? []) as unknown as { id: number; slug: string; not_text: string; created_at: string; kalp?: number }[]).map((r) => ({
      id: r.id,
      slug: r.slug,
      not: r.not_text,
      createdAt: r.created_at,
      kalp: Number(r.kalp) || 0,
    }));
    return json({ notlar }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } });
  } catch {
    return json({ notlar: [] });
  }
}

// POST /api/not  { slug, not }  → bir anı bırak.
export async function POST(request: Request) {
  // Dakikada en fazla 6 not / IP (spam'e karşı).
  if (!rateLimit(`not:${istemciKimlik(request)}`, 6, 60000)) {
    return json({ error: "çok hızlı — biraz bekle" }, { status: 429 });
  }
  let slug = "";
  let not = "";
  try {
    const body = await request.json();
    slug = String(body?.slug || "").trim();
    not = String(body?.not || "").trim();
  } catch {
    return json({ error: "gövde okunamadı" }, { status: 400 });
  }
  if (!slug || not.length < 2 || not.length > 140) {
    return json({ error: "not 2-140 karakter olmalı" }, { status: 400 });
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("not_birak", { p_slug: slug, p_not: not });
  if (error) return json({ error: error.message }, { status: 400 });
  const row = Array.isArray(data) ? data[0] : data;
  return json({ not: row ? { id: row.id, slug: row.slug, not: row.not_text, createdAt: row.created_at } : null });
}
