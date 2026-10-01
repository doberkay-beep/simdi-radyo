// İKİZ YAYIN DÜZELTMESİ (1 Eki 2026) — aynı yayın iki kez kayıtlıydı; liste,
// endeks ve senkron her çalmayı ÇİFT sayıyordu ("en az 2 istasyon" kuralını da
// tek başına geçiriyordu). Tarama: 3 günde %100 örtüşme.
//   joy-turk ↔ joyturk     → joy-turk kalır (eski, favorilerde/SEO'da o), adresi
//                             daha eksiksiz metadata veren JOY_TURK_ITUNES'a çevrilir
//   fakir-fm ↔ dt-nostalji → fakir-fm kalır
// Sonra: senkron_anlari temizlenir (ikizden doğan sahte anlar), seed.json tazelenir.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("/opt/simdi-collector/.env.local", "utf8")
    .split("\n").filter((s) => s.includes("="))
    .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1).trim()]),
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const kontrol = (ad, { error }) => { if (error) { console.error(`✗ ${ad}: ${error.message}`); process.exit(1); } console.log(`✓ ${ad}`); };

const ITUNES = "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK_ITUNES.mp3";
kontrol("joy-turk adresi → JOY_TURK_ITUNES", await sb.from("stations").update({ stream_url: ITUNES }).eq("slug", "joy-turk"));
kontrol("joyturk kapatıldı (ikiz)", await sb.from("stations").update({ is_active: false }).eq("slug", "joyturk"));
kontrol("dt-nostalji kapatıldı (fakir-fm ikizi)", await sb.from("stations").update({ is_active: false }).eq("slug", "dt-nostalji"));
kontrol("sahte senkron anları silindi", await sb.from("senkron_anlari").delete().gte("id", 0));

const seed = JSON.parse(readFileSync("/opt/simdi-collector/seed.json", "utf8"))
  .filter((s) => s.slug !== "joyturk" && s.slug !== "dt-nostalji")
  .map((s) => (s.slug === "joy-turk" ? { ...s, stream_url: ITUNES } : s));
writeFileSync("/opt/simdi-collector/seed.json", JSON.stringify(seed, null, 1));
console.log(`✓ seed.json tazelendi (${seed.length} istasyon)`);
