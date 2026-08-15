// parseTitle testleri — ağ/veritabanı gerektirmez.
// Çalıştır: npm test   (yani node src/parse.test.mjs)

import assert from "node:assert/strict";
import { parseTitle } from "./parse.mjs";

let failed = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n     ${e.message}`);
  }
};

check("normal 'Sanatçı - Parça'", () => {
  assert.deepEqual(parseTitle("Sezen Aksu - Firuze"), {
    artist: "Sezen Aksu",
    title: "Firuze",
    raw_title: "Sezen Aksu - Firuze",
  });
});

check("ilk ' - ' bölünür, sonrakiler parçada kalır", () => {
  const r = parseTitle("MFÖ - Ele Güne Karşı - Remix");
  assert.equal(r.artist, "MFÖ");
  assert.equal(r.title, "Ele Güne Karşı - Remix");
});

check("' - ' yoksa ikisi de raw_title", () => {
  assert.deepEqual(parseTitle("Sadece Başlık"), {
    artist: "Sadece Başlık",
    title: "Sadece Başlık",
    raw_title: "Sadece Başlık",
  });
});

check("boşluksuz tire bölmez", () => {
  const r = parseTitle("AC-DC");
  assert.equal(r.artist, "AC-DC");
  assert.equal(r.title, "AC-DC");
});

check("baş/son boşluklar temizlenir", () => {
  const r = parseTitle("  Barış Manço  -  Gülpembe  ");
  assert.equal(r.artist, "Barış Manço");
  assert.equal(r.title, "Gülpembe");
  assert.equal(r.raw_title, "Barış Manço  -  Gülpembe");
});

check("bir taraf boşsa bölme sayılmaz", () => {
  const r = parseTitle(" - Parça");
  assert.equal(r.artist, "- Parça");
  assert.equal(r.title, "- Parça");
});

console.log(failed === 0 ? "\nTüm testler geçti." : `\n${failed} test başarısız.`);
process.exitCode = failed === 0 ? 0 : 1;
