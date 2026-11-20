import { getSupabase } from "@/lib/supabase";
import { json } from "@/lib/json";

// GET /api/uygulama?dil=tr&platform=ios&surum=1.1 — nowby. uygulamasının sunucudan yönetilen içeriği (1.1+):
// kartlar, özel ekranlar, menü maddeleri ve ayarlar. Kaynak: Supabase `uygulama_icerik` (bkz. web/uygulama-icerik.sql).
// CDN'de 10 dk önbellek (+1 gün bayat yanıt): binlerce uygulama açılışı Supabase'e en fazla birkaç dakikada bir
// tek küçük sorgu olarak düşer. Uygulama son yanıtı diske yazar; uç düşse de bildiği içerikle çalışır.
export const dynamic = "force-dynamic";

type Satir = {
  id: string; tur: "kart" | "ekran" | "menu" | "ayar"; baslangic: string | null; bitis: string | null;
  diller: string[] | null; platformlar: string[] | null; en_dusuk_surum: string | null; sira: number; veri: unknown;
};

const PLATFORMLAR = new Set(["ios", "mac", "tv", "watch"]);

/** "1.10" > "1.9": sürümleri sayı sayı karşılaştırır. */
function surumKarsilastir(a: string, b: string): number {
  const x = a.split(".").map((n) => parseInt(n, 10) || 0), y = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const f = (x[i] ?? 0) - (y[i] ?? 0);
    if (f) return f;
  }
  return 0;
}

/** Dil sözlüğünü ({tr, en, …}) isteğin diline çevirir; iç içe her yerde. Başka nesnelere dokunmaz. */
function dileCevir(v: unknown, dil: string): unknown {
  if (Array.isArray(v)) return v.map((o) => dileCevir(o, dil));
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const anahtarlar = Object.keys(o);
    // Dil sözlüğü sayılması için en az "tr" ya da "en" anahtarı olmalı ({id, ad} gibi nesneler karışmasın).
    const sozluk = ("tr" in o || "en" in o) && anahtarlar.every((k) => /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(k))
      && anahtarlar.every((k) => typeof o[k] === "string");
    if (sozluk) return (o[dil] ?? o[dil.slice(0, 2)] ?? o.en ?? o.tr ?? Object.values(o)[0]) as string;
    return Object.fromEntries(anahtarlar.map((k) => [k, dileCevir(o[k], dil)]));
  }
  return v;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const dil = (q.get("dil") || "tr").toLowerCase().slice(0, 7);
  const platform = PLATFORMLAR.has(q.get("platform") || "") ? q.get("platform")! : "ios";
  const surum = (q.get("surum") || "0").slice(0, 12);

  let satirlar: Satir[] = [];
  let hata = false;
  try {
    // Bitmemiş ve en geç 7 gün içinde başlayacak olanlar: uygulama başlangıcı kendisi de denetler,
    // böylece önbellekteki yanıt saat başı geçişleri kaçırmaz.
    const simdi = new Date(), ufuk = new Date(simdi.getTime() + 7 * 86_400_000);
    const { data, error } = await getSupabase()
      .from("uygulama_icerik")
      .select("id,tur,baslangic,bitis,diller,platformlar,en_dusuk_surum,sira,veri")
      .eq("yayinda", true)
      .or(`bitis.is.null,bitis.gt.${simdi.toISOString()}`)
      .or(`baslangic.is.null,baslangic.lt.${ufuk.toISOString()}`)
      .order("sira", { ascending: true })
      .limit(200);
    if (error) throw error;
    satirlar = (data ?? []) as Satir[];
  } catch {
    hata = true;
  }

  const uygun = satirlar.filter((s) =>
    (!s.diller?.length || s.diller.includes(dil) || s.diller.includes(dil.slice(0, 2)))
    && (!s.platformlar?.length || s.platformlar.includes(platform))
    && (!s.en_dusuk_surum || surumKarsilastir(surum, s.en_dusuk_surum) >= 0));

  const zaman = (s: Satir) => ({ baslangic: s.baslangic, bitis: s.bitis });
  const govde = {
    surum: 1,
    kartlar: uygun.filter((s) => s.tur === "kart").map((s) => ({ id: s.id, ...zaman(s), ...(dileCevir(s.veri, dil) as object) })),
    menu: uygun.filter((s) => s.tur === "menu").map((s) => ({ id: s.id, ...zaman(s), ...(dileCevir(s.veri, dil) as object) })),
    ekranlar: Object.fromEntries(uygun.filter((s) => s.tur === "ekran").map((s) => [s.id, { id: s.id, ...zaman(s), ...(dileCevir(s.veri, dil) as object) }])),
    ayarlar: Object.fromEntries(uygun.filter((s) => s.tur === "ayar").map((s) => [s.id, (dileCevir(s.veri, dil) as { deger?: unknown })?.deger ?? null])),
  };
  // Hata olursa kısa önbellek: uygulama diskteki son yanıtla devam eder.
  return json(govde, {
    status: hata ? 503 : 200,
    headers: { "Cache-Control": hata ? "public, s-maxage=30" : "public, s-maxage=600, stale-while-revalidate=86400" },
  });
}
