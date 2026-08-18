// Katalog denetimi: seed.json'daki HER istasyonun yayınını yoklar, ölü/sessiz
// olanları listeler. Ölü çıkanları bana ver, seed.json'dan çıkarayım.
//
// Çalıştır (repo kökünden):  node probe/audit.mjs
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "../collector/src/icy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const BATCH = 10;
const TIMEOUT = 8000;

const seed = JSON.parse(await readFile(join(here, "../collector/seed.json"), "utf8"));
const stations = Array.isArray(seed) ? seed : seed.stations;

console.log(`${stations.length} istasyon yoklanıyor (${BATCH}'erli)...\n`);

const results = [];
for (let i = 0; i < stations.length; i += BATCH) {
  const batch = stations.slice(i, i + BATCH);
  const out = await Promise.all(
    batch.map(async (s) => {
      let res;
      try {
        res = await probeIcy(s.stream_url, { timeout: TIMEOUT });
      } catch (e) {
        res = { status: "dead", reason: e?.message || "hata" };
      }
      return { s, res };
    }),
  );
  for (const { s, res } of out) {
    const ok = res.status === "ok";
    const canli = ok && res.title ? "✓ canlı" : ok ? "○ sessiz" : `✗ ${res.status}`;
    results.push({ slug: s.slug, name: s.name, ok, hasTitle: ok && !!res.title, canli, url: s.stream_url });
    console.log(`  ${canli.padEnd(10)} ${s.slug}`);
  }
}

const dead = results.filter((r) => !r.ok);
const silent = results.filter((r) => r.ok && !r.hasTitle);

console.log("\n═══ ÖZET ═══");
console.log(`  canlı (şarkı bilgili): ${results.filter((r) => r.hasTitle).length}`);
console.log(`  sessiz (bağlanıyor ama başlık yok): ${silent.length}`);
console.log(`  ÖLÜ (bağlanamadı): ${dead.length}`);

if (dead.length) {
  console.log("\n── ÖLÜ istasyonlar (bunları bana ver, çıkarayım) ──");
  for (const r of dead) console.log(`  ${r.slug}  —  ${r.name}`);
}
if (silent.length) {
  console.log("\n── SESSIZ (çalışıyor ama şarkı yazmıyor; havalı cümle çıkar, kalabilir) ──");
  for (const r of silent) console.log(`  ${r.slug}  —  ${r.name}`);
}
process.exit(0);
