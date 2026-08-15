import { createClient } from "@supabase/supabase-js";

// Okuma istemcisi. Publishable (anon) anahtar kullanır; RLS ile korunur,
// yalnızca SELECT yapabilir. İstek anında oluşturulur ki build sırasında
// ortam değişkeni gerektirmesin.
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL ve SUPABASE_ANON_KEY gerekli (bkz. .env.example)");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
