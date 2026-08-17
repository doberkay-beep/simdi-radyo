// Supabase erişim katmanı. Worker service_role anahtarıyla yazar.
//
// Neden @supabase/supabase-js? Brief veritabanını Supabase olarak belirliyor,
// Faz 2 okuma API'si de aynı istemciyi kullanacak. Tek, resmi, iyi bakımlı
// bağımlılık; worker seyrek yazdığı için (yalnızca başlık değişince) HTTP
// tabanlı istemcinin maliyeti önemsiz.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    "SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli. .env.local'i doldur (bkz. .env.example).",
  );
}

const supa = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Aktif istasyonları döner.
export async function loadActiveStations() {
  const { data, error } = await supa
    .from("stations")
    .select("id, slug, name, stream_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Worker başlangıcında son bilinen başlıkları belleğe almak için.
export async function loadNowPlaying() {
  const { data, error } = await supa.from("now_playing").select("station_id, raw_title");
  if (error) throw error;
  return data ?? [];
}

// plays'e YENİ satır ekler (arşivin kalbi — sadece INSERT).
export async function insertPlay(stationId, parsed) {
  const { error } = await supa.from("plays").insert({
    station_id: stationId,
    artist: parsed.artist,
    title: parsed.title,
    raw_title: parsed.raw_title,
  });
  if (error) throw error;
}

// now_playing satırının üzerine yazar (istasyon başına tek satır).
export async function upsertNowPlaying(stationId, parsed) {
  const { error } = await supa.from("now_playing").upsert({
    station_id: stationId,
    artist: parsed.artist,
    title: parsed.title,
    raw_title: parsed.raw_title,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Sürekli başarısız istasyonu pasifleştirir.
export async function deactivateStation(stationId) {
  const { error } = await supa
    .from("stations")
    .update({ is_active: false })
    .eq("id", stationId);
  if (error) throw error;
}

// Seed loader için: istasyonları slug'a göre ekler/günceller.
export async function upsertStations(rows) {
  const { data, error } = await supa
    .from("stations")
    .upsert(rows, { onConflict: "slug" })
    .select("slug");
  if (error) throw error;
  return data ?? [];
}

// Katalogda (seed) OLMAYAN aktif istasyonları pasifleştirir.
// Silmez — arşivleri (plays) korunur, sadece listede görünmez. Katalog bizim:
// seed.json tek doğ­ru kaynak. Döner: pasifleştirilen slug listesi.
export async function deactivateMissing(keepSlugs) {
  const { data, error } = await supa.from("stations").select("slug").eq("is_active", true);
  if (error) throw error;
  const keep = new Set(keepSlugs);
  const toOff = (data ?? []).map((r) => r.slug).filter((s) => !keep.has(s));
  if (toOff.length === 0) return [];
  const { error: uErr } = await supa
    .from("stations")
    .update({ is_active: false })
    .in("slug", toOff);
  if (uErr) throw uErr;
  return toOff;
}
