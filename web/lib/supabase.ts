import { createClient } from "@supabase/supabase-js";

// PUBLIC varsayılanlar. Bunlar gizli değil:
//  - URL herkese açık.
//  - anon anahtar tarayıcıya gitmek için tasarlanmış, RLS ile korunur (yalnızca
//    okuma). Gizli olan service_role/secret anahtarı BURAYA asla konmaz.
// Ortam değişkeni (Vercel paneli) doğru ayarlıysa o kullanılır; eksik ya da
// bozuksa (ör. yanlışlıkla yapıştırılmış maskeli değer) bu varsayılana düşülür.
const FALLBACK_URL = "https://uiouzizblrkojmsqvbjk.supabase.co";
const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM";

// Değer yoksa ya da ASCII dışı karakter içeriyorsa (maskeli/bozuk) varsayılanı kullan.
function pick(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  if (/[^\x20-\x7E]/.test(value)) return fallback;
  return value;
}

// Arşivi okuyan ağır fonksiyonlar Hetzner'deki kopyadan (api.nowby.co) okunur;
// Supabase yalnızca kullanıcıların yazdığı küçük tablolara ve yedeğe kalır.
// Hetzner yanıt vermezse ya da hata dönerse aynı çağrı sessizce Supabase'e düşer.
const ARSIV_URL = pick(process.env.ARSIV_URL, "https://api.nowby.co");
const ARSIV_KAPALI = process.env.ARSIV_KAPALI === "1";
const AGIR = new Set([
  "archive_at", "dunya_anlari_liste", "endeks_ozet", "gece_listesi", "hafta_raporu", "istasyon_ozet",
  "katalog_sanatci_ara", "katalog_sarki_ara", "liste_araligi", "liste_ulke", "nabiz_artists", "nabiz_saat",
  "nabiz_top", "nabiz_trend", "rekorlar", "sanatci_ara", "sanatci_araligi", "sanatci_benzer",
  "sanatci_ozet", "sanatci_trend", "sarki_ozet", "seo_katalog",
]);

// Ham kaydı uzun aralıkta tarayanlar (içinde bulunulan ayın endeksi, 30 günlük sanatçı araması):
// Supabase'te zaman aşımına düşüyorlar, Hetzner'de 10-15 sn sürüyor; sonuçlar zaten önbellekte tutuluyor.
const UZUN = new Set(["endeks_ozet", "sanatci_ara"]);

async function arsivdenOku(ad: string, arg: object | undefined) {
  const r = await fetch(`${ARSIV_URL}/rest/v1/rpc/${ad}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg ?? {}),
    signal: AbortSignal.timeout(UZUN.has(ad) ? 25000 : 8000),
  });
  if (!r.ok) throw new Error(`arsiv ${ad} ${r.status}`);
  return r.json();
}

export function getSupabase() {
  const url = pick(process.env.SUPABASE_URL, FALLBACK_URL);
  const key = pick(process.env.SUPABASE_ANON_KEY, FALLBACK_ANON);
  const istemci = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (ARSIV_KAPALI) return istemci;
  const asil = istemci.rpc.bind(istemci);
  const rpc = (async (ad: string, arg?: object) => {
    if (AGIR.has(ad)) {
      try {
        return { data: await arsivdenOku(ad, arg), error: null, count: null, status: 200, statusText: "OK" };
      } catch (e) {
        console.warn("arşiv okunamadı, Supabase'e düşülüyor:", ad, (e as Error).message);
      }
    }
    return asil(ad, arg);
  }) as unknown as typeof istemci.rpc;
  return Object.assign(istemci, { rpc });
}
