import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

export const dynamic = "force-dynamic";

// Türkçe harfleri ve bozuk kodlanmış karakterleri sadeleştirir (veritabanındaki arama_metni ile aynı).
const sade = (t: string) =>
  t.toLocaleLowerCase("tr").replace(/[ışğüöçâîûþýð]/g, (h) => ({ ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u", þ: "s", ý: "i", ð: "g" })[h] ?? h);

type KatalogSarki = { artist: string | null; title: string | null; aslug: string | null; kez: number; son_gun: string | null };
type KatalogSanatci = { aslug: string; artist: string; kez: number };

// GET /api/ara?q=...  → şarkı ve sanatçı araması.
// Önce şarkı kataloğunda (şarkı başına tek satır, trigram dizinli; 22 Eki) arar; 2,4 milyonluk plays
// tablosu yalnız son 24 saatin "nerede çaldı" listesi için ve zaman aralığıyla sınırlı taranır.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 3) return json({ q, sarkilar: [], sanatcilar: [], rows: [], toplam: 0 });

  const supabase = getSupabase();
  const [sarkiY, sanatciY] = await Promise.all([
    supabase.rpc("katalog_sarki_ara", { q }),
    supabase.rpc("katalog_sanatci_ara", { q }),
  ]);
  if (sarkiY.error) return json({ error: sarkiY.error.message }, { status: 500 });

  // Aynı şarkının farklı yazımlarını (ŞAHSENEM / Şahsenem) tek satırda birleştir.
  const sarkiMap = new Map<string, { artist: string; title: string; aslug: string | null; kez: number; sonGun: string | null }>();
  const okunur = (a: string) => a !== a.toLocaleUpperCase("tr"); // karışık harfli yazım daha okunur
  for (const s of (sarkiY.data ?? []) as KatalogSarki[]) {
    if (!s.title) continue;
    const k = sade(`${s.artist ?? ""}|${s.title}`);
    const v = sarkiMap.get(k);
    if (!v) sarkiMap.set(k, { artist: s.artist ?? "", title: s.title, aslug: s.aslug, kez: s.kez, sonGun: s.son_gun });
    else {
      v.kez += s.kez;
      if ((s.son_gun ?? "") > (v.sonGun ?? "")) v.sonGun = s.son_gun;
      if (okunur(s.title) && !okunur(v.title)) { v.title = s.title; v.artist = s.artist ?? v.artist; }
    }
  }
  const sarkilar = [...sarkiMap.values()].sort((a, b) => b.kez - a.kez).slice(0, 12);

  const sanatciMap = new Map<string, { slug: string; ad: string; kez: number }>();
  for (const s of (sanatciY.data ?? []) as KatalogSanatci[]) {
    const k = sade(s.artist);
    const v = sanatciMap.get(k);
    if (!v) sanatciMap.set(k, { slug: s.aslug, ad: s.artist, kez: Number(s.kez) });
    else { v.kez += Number(s.kez); if (okunur(s.artist) && !okunur(v.ad)) v.ad = s.artist; }
  }
  const sanatcilar = [...sanatciMap.values()].sort((a, b) => b.kez - a.kez).slice(0, 6);

  // Son 24 saatte nerede çaldı (eski uygulamalar "rows" alanını kullanıyor).
  const like = `%${q.replace(/[%_,()]/g, "")}%`;
  const sinir = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: plays } = await supabase
    .from("plays")
    .select("station_id, artist, title, raw_title, started_at")
    .gte("started_at", sinir)
    .or(`title.ilike.${like},artist.ilike.${like}`)
    .order("started_at", { ascending: false })
    .limit(30);

  const ids = [...new Set((plays ?? []).map((p) => p.station_id))];
  const istMap = new Map<number, { slug: string; name: string; accentColor: string | null }>();
  if (ids.length) {
    const { data: sts } = await supabase.from("stations").select("id, slug, name, accent_color").in("id", ids);
    for (const s of sts ?? []) istMap.set(s.id, { slug: s.slug, name: s.name, accentColor: s.accent_color });
  }
  const rows = (plays ?? []).map((p) => {
    const st = istMap.get(p.station_id);
    return { artist: p.artist, title: p.title || p.raw_title, startedAt: p.started_at, slug: st?.slug ?? null, name: st?.name ?? "—", accentColor: st?.accentColor ?? null };
  });

  return json(
    { q, sarkilar, sanatcilar, rows, toplam: rows.length },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } },
  );
}
