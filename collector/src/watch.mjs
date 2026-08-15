// EN BASİT DENEME — veritabanı/hesap/kurulum YOK.
// seed.json'daki istasyonları yoklar ve şu an çalanı ekrana basar,
// 25 saniyede bir tazeler. Sadece kodun çalıştığını görmek için.
//
// Çalıştır (berkaydoganco klasöründeyken):
//   node collector/src/watch.mjs

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { probeIcy } from "./icy.mjs";
import { parseTitle } from "./parse.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = join(here, "..", "seed.json");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function tur(stations) {
  console.log("\n" + new Date().toLocaleTimeString("tr-TR") + " — şu an çalıyor:");
  for (const s of stations) {
    let satir;
    try {
      const res = await probeIcy(s.stream_url, { timeout: 8000 });
      if (res.status === "ok" && res.title) {
        const p = parseTitle(res.title);
        satir = p.artist === p.title ? p.title : `${p.artist} — ${p.title}`;
      } else {
        satir = "(bilgi yok)";
      }
    } catch {
      satir = "(bağlanılamadı)";
    }
    console.log(`  ${s.name.padEnd(18)} ${satir}`);
  }
}

async function main() {
  const stations = JSON.parse(await readFile(seedPath, "utf8"));
  console.log(`${stations.length} istasyon izleniyor. Durdurmak için Ctrl+C.`);
  for (;;) {
    await tur(stations);
    await delay(25000);
  }
}

main().catch((e) => {
  console.error("Hata:", e.message);
  process.exit(1);
});
