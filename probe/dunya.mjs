// DÜNYA keşfi — ülke ülke Radio Browser taraması (atılabilir keşif scripti).
// Her hedef ülkeden en çok oylanan istasyonları çeker, şu filtrelerden geçirir:
//   - HTTPS akış (proxy'siz, CPU maliyetsiz doğrudan çalma)
//   - HLS değil (tarayıcı <audio> HLS çalmaz), codec MP3/AAC
//   - haber/talk/spor/din istasyonu değil (müzik odağı)
//   - katalogda zaten yok (host + isim benzerliği)
// Kalanları ICY ile yoklar (şu an çalanı okuyabiliyor muyuz?), ülke başına
// en iyi N adayı seed-hazır JSON olarak yazar.
//
// Çalıştır (repo kökünden):  node probe/dunya.mjs
// Çıktı: probe/dunya-aday.json + probe/dunya-rapor.txt

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const UA = "Simdi/0.2";
const API = "https://de1.api.radio-browser.info";

// Hedef ülkeler → ülke başına aday üst sınırı. (TR hariç — o katalog zaten dolu.)
const ULKELER = [
  ["de", 12], ["fr", 12], ["gb", 12], ["us", 12], ["it", 10], ["es", 10],
  ["nl", 8], ["be", 6], ["ch", 6], ["at", 6], ["pt", 6], ["gr", 8],
  ["se", 6], ["no", 5], ["dk", 5], ["fi", 5], ["ie", 5], ["pl", 6],
  ["cz", 5], ["hu", 5], ["ro", 5], ["jp", 8], ["kr", 6], ["in", 6],
  ["br", 8], ["ar", 6], ["mx", 6], ["ca", 6], ["au", 8], ["za", 5],
];

// Tür eşlemesi: Radio Browser etiketleri → bizim taksonomi.
const TUR_ESLE = [
  ["klasik", /classical|klassik|classique|clasica|opera/],
  ["caz", /jazz|blues|soul|funk/],
  ["elektronik", /electronic|dance|house|techno|edm|trance|drum|dubstep|chill|lounge|ambient/],
  ["rock", /rock|metal|punk|grunge/],
  ["alternatif", /alternative|indie|eclectic|college|underground/],
  ["nostalji", /oldies|60s|70s|80s|90s|retro|nostal|schlager|classics/],
  ["pop", /pop|top ?40|hits|hit music|charts|contemporary/],
];
const YASAK = /news|talk|sport|relig|gospel|quran|islam|church|christ|speech|haber|info\b/;

function tur(tags) {
  const t = (tags || "").toLowerCase();
  if (YASAK.test(t)) return null;
  for (const [ad, re] of TUR_ESLE) if (re.test(t)) return ad;
  return "pop"; // etiketsiz popüler istasyon: genel
}

// Tür → renk ailesi; slug hash'iyle ton çeşitlemesi.
const RENK = {
  klasik: [140, 260], caz: [20, 45], elektronik: [190, 280], rock: [0, 20],
  alternatif: [90, 170], nostalji: [25, 55], pop: [300, 350],
};
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function accent(slug, genre) {
  const [a, b] = RENK[genre] ?? [200, 260];
  const hue = a + (hash(slug) % (b - a + 1));
  const sat = 42 + (hash(slug + "s") % 20);
  const lig = 42 + (hash(slug + "l") % 14);
  // hsl → hex
  const f = (n) => { const k = (n + hue / 30) % 12, c = sat / 100 * Math.min(lig / 100, 1 - lig / 100); return Math.round(255 * (lig / 100 - c * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function slugla(name) {
  return name.toLowerCase()
    .replace(/[àáâä]/g, "a").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i")
    .replace(/[òóôö]/g, "o").replace(/[ùúûü]/g, "u").replace(/[ñ]/g, "n")
    .replace(/[ç]/g, "c").replace(/[ß]/g, "ss").replace(/[æ]/g, "ae").replace(/[øö]/g, "o").replace(/[å]/g, "a")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function isimKok(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).slice(0, 2).join(" ");
}

async function ulkeGetir(cc) {
  const url = `${API}/json/stations/bycountrycodeexact/${cc}?hidebroken=true&order=votes&reverse=true&limit=60`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${cc}: HTTP ${r.status}`);
  return r.json();
}

async function main() {
  const seed = JSON.parse(await readFile(join(here, "..", "collector", "seed.json"), "utf8"));
  const varHost = new Set(seed.map((s) => { try { return new URL(s.stream_url).host; } catch { return ""; } }));
  const varSlug = new Set(seed.map((s) => s.slug));
  const varKok = new Set(seed.map((s) => isimKok(s.name)));

  const adaylar = [];
  const rapor = [];

  for (const [cc, kota] of ULKELER) {
    let liste;
    try { liste = await ulkeGetir(cc); }
    catch (e) { rapor.push(`${cc}: LISTE HATASI ${e.message}`); continue; }

    // Filtre + tekilleştirme
    const gorulenKok = new Set();
    const filtre = [];
    for (const st of liste) {
      const url = st.url_resolved || st.url || "";
      if (!url.startsWith("https://")) continue;
      if (st.hls) continue;
      const codec = (st.codec || "").toUpperCase();
      if (codec && !/MP3|AAC/.test(codec)) continue;
      if ((st.bitrate || 0) > 0 && st.bitrate < 64) continue;
      const g = tur(st.tags);
      if (!g) continue;
      const kok = isimKok(st.name);
      if (gorulenKok.has(kok) || varKok.has(kok)) continue;
      let host; try { host = new URL(url).host; } catch { continue; }
      if (varHost.has(host)) continue;
      gorulenKok.add(kok);
      filtre.push({ st, url, g });
      if (filtre.length >= kota * 3) break; // probe kotası: 3x aday yeter
    }

    // ICY yoklama — 5'erli gruplar
    const sonuc = [];
    for (let i = 0; i < filtre.length; i += 5) {
      const grup = filtre.slice(i, i + 5);
      const rs = await Promise.all(grup.map(async ({ st, url, g }) => {
        const p = await probeIcy(url, { timeout: 8000 });
        return { st, url, g, icy: p.status, title: p.title || "" };
      }));
      sonuc.push(...rs);
      const iyi = sonuc.filter((x) => x.icy === "ok" && x.title).length;
      if (iyi >= kota) break; // yeterince iyi aday bulundu
    }

    // Sırala: canlı metadata > metadata'sız-ama-canlı; sonra oy
    const secim = sonuc
      .filter((x) => x.icy === "ok")
      .sort((a, b) => (b.title ? 1 : 0) - (a.title ? 1 : 0) || (b.st.votes || 0) - (a.st.votes || 0))
      .slice(0, kota);

    for (const { st, url, g, title } of secim) {
      let slug = slugla(st.name);
      if (!slug || varSlug.has(slug)) slug = `${slug || "radyo"}-${cc}`;
      if (varSlug.has(slug)) continue;
      varSlug.add(slug);
      adaylar.push({
        slug, name: st.name.trim().slice(0, 60), city: st.state?.trim() || null,
        frequency: null, stream_url: url, homepage: st.homepage?.slice(0, 200) || null,
        accent_color: accent(slug, g), band: "int", genre: g,
        metadata_quality: title ? "good" : "none", is_active: true, sort_order: 500,
        country: cc,
      });
    }
    rapor.push(`${cc}: liste=${liste.length} filtre=${filtre.length} probe=${sonuc.length} secilen=${secim.length}`);
    console.log(rapor[rapor.length - 1]);
  }

  await writeFile(join(here, "dunya-aday.json"), JSON.stringify(adaylar, null, 1));
  await writeFile(join(here, "dunya-rapor.txt"), rapor.join("\n"));
  console.log(`TOPLAM ADAY: ${adaylar.length}`);
}

main().catch((e) => { console.error("HATA:", e); process.exit(1); });
