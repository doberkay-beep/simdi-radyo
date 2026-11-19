// collector/seed.json'daki şehirlerden web/lib/saat-dilimi-veri.json üretir:
// birden çok saat dilimli ülkelerde (ABD, Kanada, Avustralya, Brezilya…) radyonun şehri
// başkentin diliminde değilse istasyon slug'ı → IANA saat dilimi. Gerisi ülkenin
// temsilî diliminde kalır (web/lib/ulkeler.ts SAAT_DILIMI). "Gece yarısı" sayfası kullanır.
// seed.json her değiştiğinde çalıştır:  node scripts/saat-dilimi-uret.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const seed = JSON.parse(await readFile(join(kok, "collector", "seed.json"), "utf8"));

// Ülke → (şehir/eyalet adı küçük harfle → saat dilimi). Eşleşmeyen şehir başkentte kalır.
const SEHIR = {
  us: {
    "los angeles": "America/Los_Angeles", "long beach": "America/Los_Angeles", "kaliforniya": "America/Los_Angeles",
    "california": "America/Los_Angeles", "san francisco": "America/Los_Angeles", "san mateo": "America/Los_Angeles",
    "seattle": "America/Los_Angeles", "portland": "America/Los_Angeles", "las vegas": "America/Los_Angeles",
    "dallas": "America/Chicago", "houston": "America/Chicago", "austin": "America/Chicago", "chicago": "America/Chicago",
    "nashville": "America/Chicago", "new orleans": "America/Chicago", "minneapolis": "America/Chicago",
    "denver": "America/Denver", "phoenix": "America/Phoenix", "honolulu": "Pacific/Honolulu", "anchorage": "America/Anchorage",
  },
  ca: {
    "vancouver": "America/Vancouver", "british columbia": "America/Vancouver", "calgary": "America/Edmonton",
    "edmonton": "America/Edmonton", "alberta": "America/Edmonton", "winnipeg": "America/Winnipeg",
    "halifax": "America/Halifax", "nova scotia": "America/Halifax", "st. john's": "America/St_Johns",
  },
  au: {
    "south australia": "Australia/Adelaide", "adelaide": "Australia/Adelaide", "tasmania": "Australia/Hobart",
    "hobart": "Australia/Hobart", "victoria": "Australia/Melbourne", "melbourne": "Australia/Melbourne",
    "queensland": "Australia/Brisbane", "brisbane": "Australia/Brisbane", "perth": "Australia/Perth",
    "western australia": "Australia/Perth", "darwin": "Australia/Darwin",
  },
  br: { "manaus": "America/Manaus", "amazonas": "America/Manaus" },
  ru: { "novosibirsk": "Asia/Novosibirsk", "yekaterinburg": "Asia/Yekaterinburg", "vladivostok": "Asia/Vladivostok" },
  mx: { "tijuana": "America/Tijuana", "baja california": "America/Tijuana", "cancún": "America/Cancun", "cancun": "America/Cancun" },
  es: { "tenerife": "Atlantic/Canary", "gran canaria": "Atlantic/Canary", "canarias": "Atlantic/Canary" },
  pt: { "azores": "Atlantic/Azores", "açores": "Atlantic/Azores", "madeira": "Atlantic/Madeira" },
};

const map = {};
for (const s of seed) {
  const tablo = SEHIR[s.country];
  if (!tablo || !s.city) continue;
  const tz = tablo[s.city.trim().toLowerCase()];
  if (tz) map[s.slug] = tz;
}

await writeFile(join(kok, "web", "lib", "saat-dilimi-veri.json"), JSON.stringify(map, null, 1) + "\n");
console.log(`${Object.keys(map).length} istasyon başkent dışı saat diliminde → web/lib/saat-dilimi-veri.json`);
