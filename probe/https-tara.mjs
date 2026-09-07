// HTTP istasyonlar için HTTPS aday tarayıcı.
// Adaylar: (1) https + aynı host/yol (port silinmiş), (2) https + aynı URL.
// Ses doğrulaması: 200 + audio/mpegurl/aac content-type ya da ICY başlığı.
import { readFileSync, writeFileSync } from "node:fs";

const seed = JSON.parse(readFileSync("collector/seed.json", "utf8"));
const ist = Array.isArray(seed) ? seed : (seed.stations || seed.istasyonlar);
const httpler = ist.filter(s => String(s.stream_url || "").startsWith("http://"));

const dene = (url) => new Promise(async (coz) => {
  const ctl = new AbortController();
  const t = setTimeout(() => { ctl.abort(); }, 7000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "Icy-MetaData": "1", "User-Agent": "SIMDI-radyo-probe" } });
    clearTimeout(t);
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const icy = r.headers.get("icy-name") || r.headers.get("icy-br");
    const ok = r.ok && (ct.includes("audio") || ct.includes("mpegurl") || ct.includes("octet-stream") || !!icy);
    try { r.body?.cancel(); } catch {}
    coz(ok ? { ok: true, ct, icy: !!icy } : { ok: false, durum: r.status, ct });
  } catch (e) { clearTimeout(t); coz({ ok: false, hata: String(e?.cause?.code || e?.name || e).slice(0, 60) }); }
});

const sonuc = [];
for (const s of httpler) {
  const u = new URL(s.stream_url);
  const adaylar = [...new Set([
    `https://${u.hostname}${u.pathname}${u.search}`,
    s.stream_url.replace("http://", "https://"),
  ])];
  let bulunan = null, detay = null;
  for (const a of adaylar) {
    const r = await dene(a);
    if (r.ok) { bulunan = a; detay = r; break; }
  }
  sonuc.push({ slug: s.slug, eski: s.stream_url, yeni: bulunan, detay });
  console.log(bulunan ? `✓ ${s.slug} → ${bulunan}` : `✗ ${s.slug}`);
}
writeFileSync("probe/https-sonuc.json", JSON.stringify(sonuc, null, 2));
const ok = sonuc.filter(x => x.yeni).length;
console.log(`\nHTTPS bulunan: ${ok}/${sonuc.length}`);
