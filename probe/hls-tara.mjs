// Proxy'de kalan (http://) istasyonlar için HLS/HTTPS ayna tarayıcı.
// Kaynak: Radio Browser. Her aday DOĞRULANIR:
//   - .m3u8 → manifest (#EXTM3U) + host, istasyonun ev sahibi alanıyla ya da
//     adıyla eşleşmeli (yabancı yayını yanlışlıkla bağlamamak için)
//   - düz https ses → ICY adı istasyon adıyla eşleşmeli
// Sonuç probe/hls-sonuc.json'a yazılır; seed'e ELLE uygulanır.
import { readFileSync, writeFileSync } from "node:fs";

const seed = JSON.parse(readFileSync("collector/seed.json", "utf8"));
const ist = Array.isArray(seed) ? seed : seed.stations;
const httpler = ist.filter((s) => String(s.stream_url || "").startsWith("http://"));

const norm = (t) =>
  String(t || "")
    .toLowerCase()
    .replaceAll("ı", "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// isim eşleşmesi: istasyon adının anlamlı kelimeleri aday metinde geçmeli
function adUyar(istAd, adayMetin) {
  const a = norm(istAd).split(" ").filter((k) => k.length > 2 && !["radyo", "radio", "the"].includes(k));
  const m = norm(adayMetin);
  if (!a.length) return false;
  return a.every((k) => m.includes(k));
}

async function fetchT(url, opts = {}, ms = 7000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }
}

async function rbAra(ad) {
  try {
    const r = await fetchT(
      `https://all.api.radio-browser.info/json/stations/byname/${encodeURIComponent(ad)}?limit=12&hidebroken=true`,
      { headers: { "User-Agent": "SIMDI-radyo-hls-tara" } },
    );
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

async function dogrulaM3u8(url, s) {
  try {
    const r = await fetchT(url);
    if (!r.ok) return null;
    const metin = (await r.text()).slice(0, 4000);
    if (!metin.includes("#EXTM3U")) return null;
    // host doğrulaması: ev sahibi alanla ya da adla eşleşme
    const host = new URL(r.url || url).hostname;
    const ev = s.homepage ? new URL(s.homepage).hostname.replace(/^www\./, "") : "";
    const evKok = ev.split(".").slice(-2)[0] || "";
    const uygun = (evKok && host.includes(evKok)) || adUyar(s.name, host) || adUyar(s.name, url);
    return { tip: "hls", uygun, kanit: host };
  } catch {
    return null;
  }
}

async function dogrulaIcy(url, s) {
  try {
    const r = await fetchT(url, { headers: { "Icy-MetaData": "1", "User-Agent": "SIMDI-radyo-probe" } });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const icyName = r.headers.get("icy-name") || "";
    try { r.body?.cancel(); } catch { /* yoksay */ }
    if (!r.ok || !(ct.includes("audio") || ct.includes("octet-stream") || icyName)) return null;
    const uygun = adUyar(s.name, icyName);
    return { tip: "icy", uygun, kanit: icyName || ct };
  } catch {
    return null;
  }
}

const sonuc = [];
for (const s of httpler) {
  const adaylar = await rbAra(s.name);
  const gorulen = new Set();
  let bulunan = null;
  for (const a of adaylar) {
    const url = String(a.url_resolved || a.url || "");
    if (!url.startsWith("https://") || gorulen.has(url)) continue;
    gorulen.add(url);
    const hls = /\.m3u8(\?|$)/i.test(url) || a.hls === 1;
    const d = hls ? await dogrulaM3u8(url, s) : await dogrulaIcy(url, s);
    if (d) {
      const kayit = { url, ...d, rbAd: a.name };
      if (d.uygun) { bulunan = kayit; break; }
      // uygun değilse not düş ama kullanma
      (s._zayif ||= []).push(kayit);
    }
  }
  sonuc.push({ slug: s.slug, name: s.name, eski: s.stream_url, yeni: bulunan, zayif: s._zayif || [] });
  console.log(bulunan ? `✓ ${s.slug} → ${bulunan.url} (${bulunan.tip}: ${bulunan.kanit})` : `✗ ${s.slug}`);
}

writeFileSync("probe/hls-sonuc.json", JSON.stringify(sonuc, null, 2));
const ok = sonuc.filter((x) => x.yeni);
console.log(`\nDoğrulanmış ayna: ${ok.length}/${sonuc.length}`);
for (const x of ok) console.log(`  ${x.slug} → ${x.yeni.url}`);
