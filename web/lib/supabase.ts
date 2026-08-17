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

export function getSupabase() {
  const url = pick(process.env.SUPABASE_URL, FALLBACK_URL);
  const key = pick(process.env.SUPABASE_ANON_KEY, FALLBACK_ANON);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
