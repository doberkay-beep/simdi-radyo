// Katalog seed'i. İstasyonlar Faz 0 raporundan ELLE seçilir, seed.json'a
// yazılır, buradan veritabanına aktarılır. Katalog Radio Browser'dan CANLI
// çekilmez — katalog bizim.
//
// Çalıştır: npm run seed   (yani node --env-file=.env.local src/seed.mjs)

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { upsertStations } from "./supabase.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = join(here, "..", "seed.json");

const ALLOWED = new Set([
  "slug", "name", "city", "frequency", "stream_url", "homepage",
  "accent_color", "band", "metadata_quality", "is_active", "sort_order",
]);

function validate(list) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("seed.json boş ya da dizi değil.");
  }
  const slugs = new Set();
  list.forEach((s, i) => {
    if (!s.slug) throw new Error(`#${i}: slug zorunlu`);
    if (!s.name) throw new Error(`#${i} (${s.slug}): name zorunlu`);
    if (!s.stream_url) throw new Error(`#${i} (${s.slug}): stream_url zorunlu`);
    if (slugs.has(s.slug)) throw new Error(`yinelenen slug: ${s.slug}`);
    slugs.add(s.slug);
    for (const k of Object.keys(s)) {
      if (!ALLOWED.has(k)) throw new Error(`#${i} (${s.slug}): bilinmeyen alan '${k}'`);
    }
  });
}

async function main() {
  let list;
  try {
    list = JSON.parse(await readFile(seedPath, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(`seed.json bulunamadı. Örnek için seed.example.json'a bak.`);
    }
    throw err;
  }
  validate(list);
  const written = await upsertStations(list);
  console.log(`${written.length} istasyon veritabanına yazıldı (slug'a göre upsert).`);
}

main().catch((err) => {
  console.error("HATA:", err.message);
  process.exit(1);
});
