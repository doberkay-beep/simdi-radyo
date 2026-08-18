// Uzaktan (GitHub Actions'ın açık ağından) radio-browser'da isimle istasyon
// arar, DOĞRULANMIŞ (lastcheckok) çalışan yayın adreslerini yazar.
// Yerel ortam radio-browser'ı engellediği için bunu Actions'ta çalıştırıyoruz.
//
// Girdi: Q ortam değişkeni (aranacak isim). Örn: Q="baba radyo"
import { probeIcy } from "../collector/src/icy.mjs";

const Q = (process.env.Q || "").trim();
if (!Q) {
  console.log("Q (aranacak isim) boş.");
  process.exit(0);
}

const SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
];

async function byName(name) {
  for (const s of SERVERS) {
    try {
      const r = await fetch(
        `${s}/json/stations/byname/${encodeURIComponent(name)}?hidebroken=true&order=votes&reverse=true&limit=12`,
        { headers: { "User-Agent": "simdi-find/1.0" }, signal: AbortSignal.timeout(15000) },
      );
      if (!r.ok) continue;
      const d = await r.json();
      if (Array.isArray(d)) return d;
    } catch {
      // sıradaki sunucu
    }
  }
  return [];
}

console.log(`radio-browser'da aranıyor: "${Q}"\n`);
const list = await byName(Q);
if (!list.length) {
  console.log("Sonuç yok.");
  process.exit(0);
}

// radio-browser'ın çalışır dediklerini bir de ICY ile yoklayıp teyit et.
const seen = new Set();
for (const st of list) {
  const url = st.url_resolved || st.url;
  if (!url || seen.has(url)) continue;
  seen.add(url);
  let live = "?";
  try {
    const res = await probeIcy(url, { timeout: 8000 });
    live = res.status === "ok" ? (res.title ? `canlı: ${res.title.slice(0, 40)}` : "sessiz(başlıksız)") : res.status;
  } catch (e) {
    live = "hata";
  }
  const rbOk = st.lastcheckok === 1 || st.lastcheckok === "1";
  console.log(`${rbOk ? "✓" : "✗"} ${st.name}`);
  console.log(`    kod: ${st.codec}/${st.bitrate}  ülke: ${st.countrycode}  yoklama: ${live}`);
  console.log(`    URL: ${url}\n`);
}
process.exit(0);
