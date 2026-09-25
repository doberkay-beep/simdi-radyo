// Katalog denetimi (sağlık robotu): seed.json'daki HER istasyonun yayınını
// yoklar (ICY akışları başlıkla, HLS akışları manifest ile) ve canlı siteden
// metadata bayatlığını ölçer. GitHub Actions'ta çalışınca özet raporu
// GITHUB_STEP_SUMMARY'ye yazar; ÖLÜ istasyon varsa 1 ile çıkar (mail düşer).
//
// Çalıştır (repo kökünden):  node probe/audit.mjs
import { readFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const BATCH = 10;
const TIMEOUT = 8000;
const BAYAT_SAAT = 48; // metadata bu kadar saattir kıpırdamıyorsa "bayat"

const seed = JSON.parse(await readFile(join(here, "../collector/seed.json"), "utf8"));
const stations = Array.isArray(seed) ? seed : seed.stations;

async function probeHls(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) return { status: "dead", reason: `http ${res.status}` };
    const metin = (await res.text()).slice(0, 4000);
    if (!metin.includes("#EXTM3U")) return { status: "dead", reason: "manifest değil" };
    return { status: "ok", title: null, hls: true };
  } catch (e) {
    return { status: "dead", reason: e?.name === "AbortError" ? "zaman aşımı" : e?.message || "hata" };
  } finally {
    clearTimeout(t);
  }
}

console.log(`${stations.length} istasyon yoklanıyor (${BATCH}'erli)...\n`);

const results = [];
for (let i = 0; i < stations.length; i += BATCH) {
  const batch = stations.slice(i, i + BATCH);
  const out = await Promise.all(
    batch.map(async (s) => {
      const hls = /\.m3u8(\?|$)/i.test(s.stream_url);
      let res;
      try {
        res = hls ? await probeHls(s.stream_url) : await probeIcy(s.stream_url, { timeout: TIMEOUT });
      } catch (e) {
        res = { status: "dead", reason: e?.message || "hata" };
      }
      return { s, res, hls };
    }),
  );
  for (const { s, res, hls } of out) {
    const ok = res.status === "ok";
    const canli = ok && res.title ? "✓ canlı" : ok ? (hls ? "✓ hls" : "○ sessiz") : `✗ ${res.status}`;
    results.push({ slug: s.slug, name: s.name, ok, hls, hasTitle: ok && !!res.title, canli, url: s.stream_url, mq: s.metadata_quality || null, reason: res.reason || null });
    console.log(`  ${canli.padEnd(10)} ${s.slug}`);
  }
}

// Metadata bayatlığı — canlı sitenin gördüğü son parça zamanı.
const bayatlar = [];
try {
  const res = await fetch("https://necaliyor.co/api/now", { headers: { "User-Agent": "simdi-audit" } });
  const { stations: canliListe } = await res.json();
  const byNow = new Map((canliListe ?? []).map((s) => [s.slug, s]));
  const simdi = Date.now();
  for (const s of stations) {
    if ((s.metadata_quality || "") === "none") continue; // hiç başlık beklemiyoruz
    const c = byNow.get(s.slug);
    if (!c) continue;
    const u = c.nowPlaying?.updatedAt ? new Date(c.nowPlaying.updatedAt).getTime() : 0;
    const saat = u ? Math.round((simdi - u) / 3600000) : Infinity;
    if (saat > BAYAT_SAAT) {
      bayatlar.push({ slug: s.slug, name: s.name, saat: u ? saat : null });
    }
  }
} catch (e) {
  console.log(`\n(bayatlık ölçülemedi: ${e?.message || e})`);
}

const dead = results.filter((r) => !r.ok);
const silent = results.filter((r) => r.ok && !r.hls && !r.hasTitle);

console.log("\n═══ ÖZET ═══");
console.log(`  canlı (şarkı bilgili): ${results.filter((r) => r.hasTitle).length}`);
console.log(`  hls (manifest sağlıklı): ${results.filter((r) => r.ok && r.hls).length}`);
console.log(`  sessiz (bağlanıyor ama başlık yok): ${silent.length}`);
console.log(`  ÖLÜ (bağlanamadı): ${dead.length}`);
console.log(`  BAYAT metadata (>${BAYAT_SAAT} sa): ${bayatlar.length}`);

if (dead.length) {
  console.log("\n── ÖLÜ istasyonlar (bunları bana ver, çıkarayım) ──");
  for (const r of dead) console.log(`  ${r.slug}  —  ${r.name}  (${r.reason})`);
}
if (bayatlar.length) {
  console.log(`\n── BAYAT metadata (akış canlı ama parça yazmıyor) ──`);
  for (const r of bayatlar) console.log(`  ${r.slug}  —  ${r.name}  (${r.saat === null ? "hiç" : r.saat + " sa"})`);
}
if (silent.length) {
  console.log("\n── SESSIZ (çalışıyor ama şarkı yazmıyor; havalı cümle çıkar, kalabilir) ──");
  for (const r of silent) console.log(`  ${r.slug}  —  ${r.name}`);
}

// GitHub Actions özeti
if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [
    `## 📻 Katalog sağlığı — ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `| Durum | Sayı |`,
    `|---|---|`,
    `| ✓ canlı (şarkı bilgili) | ${results.filter((r) => r.hasTitle).length} |`,
    `| ✓ HLS sağlıklı | ${results.filter((r) => r.ok && r.hls).length} |`,
    `| ○ sessiz | ${silent.length} |`,
    `| ✗ ölü | ${dead.length} |`,
    `| 🕰 bayat metadata (>${BAYAT_SAAT} sa) | ${bayatlar.length} |`,
    ``,
    ...(dead.length ? [`### ✗ Ölü`, ...dead.map((r) => `- \`${r.slug}\` — ${r.name} (${r.reason})`), ``] : []),
    ...(bayatlar.length ? [`### 🕰 Bayat metadata`, ...bayatlar.map((r) => `- \`${r.slug}\` — ${r.name} (${r.saat === null ? "hiç görülmedi" : r.saat + " saat"})`), ``] : []),
  ].join("\n");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, md + "\n");
}

process.exit(dead.length ? 1 : 0);
