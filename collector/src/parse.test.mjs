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

// --- 23 Eki temizlik kuralları ---
check("XML RadioInfo içinden sanatçı ve parça", () => {
  const x = '<?xml version="1.0"?><RadioInfo><Table><DB_DALET_ARTIST_NAME>Janet Jackson</DB_DALET_ARTIST_NAME><DB_DALET_TITLE_NAME>Let\'s Wait Awhile</DB_DALET_TITLE_NAME></Table></RadioInfo>';
  assert.equal(normalizeTitle(x, "Smooth FM"), "Janet Jackson - Let's Wait Awhile");
});
check("reklam kodu çöp", () => assert.equal(normalizeTitle("start_ad_break_30000", "Newstalk"), ""));
check("şablon metin çöp", () => assert.equal(normalizeTitle("Now Playing info goes here", "Oui FM"), ""));
check("boş liste çöp", () => assert.equal(normalizeTitle("Empty playlist", "X"), ""));
check("yalnız alt çizgi çöp", () => assert.equal(normalizeTitle("_", "Talk"), ""));
check("artı ile yapışık program adı çöp", () => assert.equal(normalizeTitle("Free+FMRokola+I", "Free FM"), ""));
check("istasyon çekirdek adı çöp", () => assert.equal(normalizeTitle("Kent Fm", "Radyo Kent"), ""));
check("alt çizgili başlık boşluğa", () => assert.equal(normalizeTitle("Enta_Maghroor", "Amr Diab Radio"), "Enta Maghroor"));
check("@sayaç atılır", () => assert.equal(normalizeTitle("Bedia Akartürk - Kesik Çayır@12022", "Ankara"), "Bedia Akartürk - Kesik Çayır"));
check("sonda sarkan tire atılır", () => assert.equal(normalizeTitle("Extreme Deep House Radio -", "Başka"), "Extreme Deep House Radio"));
check("'Sanatçı- Şarkı' bölünür", () => {
  const r = parseTitle("Ceylan- Hep Ezildim");
  assert.equal(r.artist, "Ceylan"); assert.equal(r.title, "Hep Ezildim");
});
check("yıldız ayracı", () => {
  const r = parseTitle("ELTON JOHN * DON'T LET THE SUN GO DOWN ON ME");
  assert.equal(r.artist, "ELTON JOHN");
});
check("modifier tire ayracı", () => assert.equal(parseTitle("Kim Wilde ˗ Cambodia").title, "Cambodia"));
check("gerçek parça bozulmaz", () => assert.equal(normalizeTitle("Sezen Aksu - Firuze", "Kral FM"), "Sezen Aksu - Firuze"));
check("tireli parça adı bozulmaz", () => assert.equal(parseTitle("MFÖ - Ele Güne Karşı - Remix").title, "Ele Güne Karşı - Remix"));

console.log(failed === 0 ? "\nTüm testler geçti." : `\n${failed} test başarısız.`);
process.exitCode = failed === 0 ? 0 : 1;
