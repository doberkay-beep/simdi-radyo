// dunya-aday.json'daki seçilmiş adayları ICY ile yeniden yoklar, örnek başlıkları basar.
import { readFile } from "node:fs/promises";
import { probeIcy } from "../collector/src/icy.mjs";
const l = JSON.parse(await readFile(new URL("./dunya-aday.json", import.meta.url), "utf8"));
for (let i = 0; i < l.length; i += 8) {
  const rs = await Promise.all(l.slice(i, i + 8).map(async (s) => [s, await probeIcy(s.stream_url, { timeout: 9000 })]));
  for (const [s, p] of rs) console.log(`${s.country} ${p.status.padEnd(6)} ${s.slug.padEnd(38)} ${(p.title || "").slice(0, 70)}`);
}
