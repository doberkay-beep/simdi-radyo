// collector/seed.json'daki country alanlarından web/lib/ulke-veri.json üretir.
// seed.json her değiştiğinde çalıştır:  node scripts/ulke-uret.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const seed = JSON.parse(await readFile(join(kok, "collector", "seed.json"), "utf8"));

const map = {};
for (const s of seed) {
  if (!s.country) throw new Error(`${s.slug}: country eksik`);
  map[s.slug] = s.country;
}

await writeFile(join(kok, "web", "lib", "ulke-veri.json"), JSON.stringify(map, null, 1) + "\n");
console.log(`${Object.keys(map).length} istasyon → web/lib/ulke-veri.json`);
