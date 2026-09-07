// Kalan HTTP istasyonları için Radio Browser'da HTTPS alternatif ara.
import { readFileSync, writeFileSync } from "node:fs";
const sonuc = JSON.parse(readFileSync("probe/https-sonuc.json", "utf8"));
const seed = JSON.parse(readFileSync("collector/seed.json", "utf8"));
const ist = Array.isArray(seed) ? seed : (seed.stations || seed.istasyonlar);
const adlar = Object.fromEntries(ist.map(s => [s.slug, s.name || s.ad || s.slug]));
const kalan = sonuc.filter(x => !x.yeni);
const RB = "https://de1.api.radio-browser.info/json/stations/byname/";

const dene = async (url) => {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "Icy-MetaData": "1", "User-Agent": "SIMDI-probe" } });
    clearTimeout(t);
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const icy = r.headers.get("icy-name") || r.headers.get("icy-br");
    try { r.body?.cancel(); } catch {}
    return r.ok && (ct.includes("audio") || ct.includes("octet-stream") || !!icy) && !ct.includes("mpegurl");
  } catch { clearTimeout(t); return false; }
};

const bulunanlar = [];
for (const k of kalan) {
  const ad = adlar[k.slug];
  try {
    const r = await fetch(RB + encodeURIComponent(ad), { headers: { "User-Agent": "SIMDI-probe" } });
    const liste = await r.json();
    const adaylar = liste.filter(x => x.url_resolved?.startsWith("https://") && !x.url_resolved.includes(".m3u8")).slice(0, 3);
    let ok = null;
    for (const a of adaylar) { if (await dene(a.url_resolved)) { ok = a.url_resolved; break; } }
    if (ok) { bulunanlar.push({ slug: k.slug, yeni: ok }); console.log(`✓ ${k.slug} → ${ok}`); }
    else console.log(`✗ ${k.slug} (${ad}) — aday yok/çalışmıyor`);
  } catch (e) { console.log(`! ${k.slug} hata`); }
}
writeFileSync("probe/rb-sonuc.json", JSON.stringify(bulunanlar, null, 2));
console.log(`\nRB'den bulunan: ${bulunanlar.length}/${kalan.length}`);
