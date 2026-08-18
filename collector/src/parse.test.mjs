// parseTitle testleri — ağ/veritabanı gerektirmez.
// Çalıştır: npm test   (yani node src/parse.test.mjs)

import assert from "node:assert/strict";
import { parseTitle, normalizeTitle } from "./parse.mjs";

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

// --- normalizeTitle (A2: çöp/çift başlık temizliği) ---
check("normalize: gerçek parça dokunulmaz", () => {
  assert.equal(normalizeTitle("Sezen Aksu - Firuze"), "Sezen Aksu - Firuze");
});
check("normalize: çift ayraçlı başlık teke iner", () => {
  assert.equal(
    normalizeTitle("Sezen Aksu - Firuze - Sezen Aksu - Firuze"),
    "Sezen Aksu - Firuze",
  );
});
check("normalize: ayraçsız birebir tekrar teke iner", () => {
  assert.equal(normalizeTitle("Gülpembe Gülpembe"), "Gülpembe");
});
check("normalize: 'Now Playing:' öneki atılır", () => {
  assert.equal(normalizeTitle("Now Playing: MFÖ - Ali Desidero"), "MFÖ - Ali Desidero");
});
check("normalize: reklam çöpü boş döner", () => {
  assert.equal(normalizeTitle("Reklam"), "");
  assert.equal(normalizeTitle("adw_ad='true'"), "");
});
check("normalize: tek başına URL çöp", () => {
  assert.equal(normalizeTitle("https://radyo.example.com"), "");
});
check("normalize: istasyon adının kendisi çöp", () => {
  assert.equal(normalizeTitle("Radyo 45'lik", "Radyo 45'lik"), "");
});
check("normalize: 'Unknown' çöp", () => {
  assert.equal(normalizeTitle("Unknown"), "");
});

console.log(failed === 0 ? "\nTüm testler geçti." : `\n${failed} test başarısız.`);
process.exitCode = failed === 0 ? 0 : 1;
