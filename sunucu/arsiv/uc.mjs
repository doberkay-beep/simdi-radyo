// nowby arşiv okuma ucu (Hetzner, 23 Eki). Supabase/PostgREST'in RPC biçimini taklit eder:
//   POST /rest/v1/rpc/<fonksiyon>  gövde: {"p_slug": "..."}  → PostgREST'le aynı JSON
// Böylece sitede supabase-js ikinci bir istemciyle, kod değişmeden buraya bağlanır.
// Yalnız İZİNLİ okuma fonksiyonları çalışır; bağlantı salt-okunur "okuyucu" rolüyle.
import http from "node:http";
import pg from "pg";

// PostgREST ile aynı JSON: date "2026-10-22", bigint/numeric sayı (pg varsayılanı metin).
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(20, (v) => Number(v));
pg.types.setTypeParser(1700, (v) => Number(v));
// Zaman damgaları PostgREST'in yazdığı gibi: "2026-10-19T23:51:30.274128+00:00".
const isoZaman = (v) => v.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00");
pg.types.setTypeParser(1184, isoZaman);
pg.types.setTypeParser(1114, (v) => v.replace(" ", "T"));

const PORT = Number(process.env.UC_PORT) || 3010;
const db = new pg.Pool({ connectionString: process.env.OKUYUCU_PG_URL, max: 8, statement_timeout: 15_000 });
const IZINLI = new Set([
  "archive_at", "benzerler", "endeks_ozet", "gece_listesi", "hafta_raporu", "istasyon_ozet",
  "katalog_sanatci_ara", "katalog_sarki_ara", "liste_araligi", "liste_ulke", "nabiz_artists", "nabiz_saat", "nabiz_top",
  "nabiz_trend", "rekorlar", "sanatci_ara", "sanatci_araligi", "sanatci_benzer", "sanatci_ozet",
  "sanatci_trend", "sarki_ozet", "seo_katalog", "endeks_hesapla",
]);
const log = (...a) => console.log(new Date().toISOString(), ...a);

// Fonksiyonların imzası: küme mi döner, parametre adları neler.
const imza = new Map();
async function imzalariYukle() {
  const { rows } = await db.query(`
    select p.proname, p.proretset, coalesce(p.proargnames, '{}') as adlar, p.pronargs
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any($1)`, [[...IZINLI]]);
  for (const r of rows) imza.set(r.proname, { kume: r.proretset, adlar: r.adlar.slice(0, r.pronargs) });
  log(`${imza.size} fonksiyon hazır`);
}

function gonder(res, kod, govde) {
  const metin = govde === undefined ? "" : JSON.stringify(govde);
  res.writeHead(kod, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info, prefer, accept-profile, content-profile" });
  res.end(metin);
}

const sunucu = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return gonder(res, 204);
  const m = req.url.match(/^\/rest\/v1\/rpc\/([a-z_]+)/);
  if (req.url === "/saglik") return gonder(res, 200, { ok: true });
  if (!m || !IZINLI.has(m[1]) || !imza.has(m[1])) return gonder(res, 404, { message: "yok" });
  const ad = m[1], { kume, adlar } = imza.get(ad);
  let govde = "";
  for await (const parca of req) { govde += parca; if (govde.length > 10_000) return gonder(res, 413, { message: "büyük" }); }
  let arg = {};
  try { arg = govde ? JSON.parse(govde) : {}; } catch { return gonder(res, 400, { message: "gövde" }); }
  const kullan = adlar.filter((a) => a in arg);
  const yer = kullan.map((a, i) => `${a} => $${i + 1}`).join(", ");
  const sql = kume ? `select * from public.${ad}(${yer})` : `select public.${ad}(${yer}) as r`;
  const bas = Date.now();
  try {
    const { rows } = await db.query(sql, kullan.map((a) => arg[a]));
    gonder(res, 200, kume ? rows : rows[0]?.r ?? null);
    const sure = Date.now() - bas;
    if (sure > 1500) log(`yavaş ${ad} ${sure}ms`);
  } catch (err) {
    log(`! ${ad}:`, err.message);
    gonder(res, 400, { message: err.message });
  }
});

await imzalariYukle();
sunucu.listen(PORT, "127.0.0.1", () => log(`arşiv ucu 127.0.0.1:${PORT}`));
