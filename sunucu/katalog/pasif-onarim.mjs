// PASİF ONARIMI (3 Eki 2026) — toplayıcı "şarkı adı yok"u "radyo öldü" sayıp
// 8 dakikada istasyon kapatıyordu (185 kapatma; Virgin, Kiss Türk, Kafa, Eksen,
// Açık Radyo, TRT FM, Power...). Bu betik:
//   1) emekli.json'dakiler HARİÇ bütün pasif istasyonları yoklar,
//   2) yayını gerçekten çalanları (bağlanan: başlıklı ya da başlıksız, HLS dahil) geri açar,
//   3) seed.json'u DB'den tazeler.
// Toplayıcının bir daha kapatmaması için ayrıca: MAX_FAILURES systemd ayarı (kurulum komutunda).
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { probeIcy } from "/opt/simdi-collector/src/icy.mjs";

const env = Object.fromEntries(
  readFileSync("/opt/simdi-collector/.env.local", "utf8")
    .split("\n").filter((s) => s.includes("="))
    .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1).trim()]),
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const EMEKLI = new Set(Object.keys(JSON.parse(readFileSync("/opt/simdi/katalog/emekli.json", "utf8"))).filter((k) => !k.startsWith("_")));

async function hls(url) {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 9000);
    const r = await fetch(url, { signal: c.signal, redirect: "follow" });
    clearTimeout(t);
    return r.ok && (await r.text()).slice(0, 3000).includes("#EXTM3U");
  } catch { return false; }
}
async function yayinda(s) {
  if (/\.m3u8(\?|$)/i.test(s.stream_url || "")) return hls(s.stream_url);
  try { const r = await probeIcy(s.stream_url, { timeout: 9000 }); return r.status === "ok" || r.status === "none"; }
  catch { return false; }
}

const { data: pasifler, error } = await sb.from("stations").select("id, slug, name, band, stream_url").eq("is_active", false);
if (error) { console.error(error.message); process.exit(1); }
const adaylar = pasifler.filter((s) => !EMEKLI.has(s.slug));
console.log(`${pasifler.length} pasif · ${pasifler.length - adaylar.length} emekli (dokunulmaz) · ${adaylar.length} yoklanıyor (10'arlı)…`);

const acilan = [], olu = [];
for (let i = 0; i < adaylar.length; i += 10) {
  await Promise.all(adaylar.slice(i, i + 10).map(async (s) => {
    if (await yayinda(s)) {
      const { error: e } = await sb.from("stations").update({ is_active: true }).eq("id", s.id);
      if (!e) acilan.push(s);
    } else olu.push(s);
  }));
}

// seed.json'u DB'den tazele (country bilgisini eski seed + eklenen'den taşı).
const ekstra = new Map();
for (const yol of ["/opt/simdi-collector/seed.json", "/opt/simdi/katalog/eklenen.json"]) {
  if (existsSync(yol)) for (const e of JSON.parse(readFileSync(yol, "utf8"))) ekstra.set(e.slug, e);
}
const { data: aktif } = await sb.from("stations")
  .select("slug, name, city, frequency, stream_url, homepage, accent_color, band, metadata_quality, is_active, sort_order, genre")
  .eq("is_active", true).order("sort_order");
writeFileSync("/opt/simdi-collector/seed.json", JSON.stringify(aktif.map((s) => ({ ...s, country: ekstra.get(s.slug)?.country ?? null })), null, 1));

const tr = acilan.filter((s) => s.band === "tr").map((s) => s.name);
console.log(`\n✚ GERİ AÇILAN: ${acilan.length} (Türk: ${tr.length})`);
console.log(`  Türk radyoları: ${tr.join(", ")}`);
console.log(`✝ hâlâ ulaşılamayan: ${olu.length} → ${olu.map((s) => s.slug).join(", ")}`);
console.log(`AKTİF KATALOG: ${aktif.length}`);
