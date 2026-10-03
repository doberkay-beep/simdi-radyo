// ŞİMDİ — Instagram profil resmi seçenekleri (1080×1080) + karşılaştırma sayfası.
// Instagram fotoğrafı daireye kırpar; her seçenek daire güvenli alanında tasarlandı.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";

const KOR = "#e5382c", SICAK = "#ff9b76", KREM = "#f2e6da", MUREKKEP = "#0b0708";
const FONT = ["/opt/simdi/rapor/InstrumentSans-Bold.ttf", "/opt/simdi/rapor/SpaceMono-Bold.ttf"];

// Her seçenek 1080'lik tuvalde bir <g> içeriği döndürür.
const SECENEK = {
  // A — Ş + canlı nokta: logonun ilk harfi, yanında "yayında" kırmızı noktası.
  a: (id) => `
    <defs><radialGradient id="g${id}" cx="0.5" cy="0.32" r="0.75">
      <stop offset="0" stop-color="#3a120f"/><stop offset="0.55" stop-color="#16090f"/><stop offset="1" stop-color="${MUREKKEP}"/>
    </radialGradient>
    <radialGradient id="n${id}"><stop offset="0" stop-color="${KOR}" stop-opacity="0.55"/><stop offset="1" stop-color="${KOR}" stop-opacity="0"/></radialGradient></defs>
    <rect width="1080" height="1080" fill="url(#g${id})"/>
    <text x="500" y="742" font-family="Instrument Sans" font-weight="700" font-size="700" fill="${KREM}" stroke="${KREM}" stroke-width="30" stroke-linejoin="round" text-anchor="middle">Ş</text>
    <circle cx="805" cy="330" r="150" fill="url(#n${id})"/>
    <circle cx="805" cy="330" r="62" fill="${KOR}"/>`,
  // B — Kor zemin: akışta en çok göze çarpan; marka rengi tam dolu.
  b: (id) => `
    <defs><radialGradient id="g${id}" cx="0.5" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#f0503f"/><stop offset="1" stop-color="#b8261c"/>
    </radialGradient></defs>
    <rect width="1080" height="1080" fill="url(#g${id})"/>
    <text x="500" y="742" font-family="Instrument Sans" font-weight="700" font-size="700" fill="${KREM}" stroke="${KREM}" stroke-width="30" stroke-linejoin="round" text-anchor="middle">Ş</text>
    <circle cx="805" cy="330" r="62" fill="${MUREKKEP}"/>`,
  // C — Sinyal: sitenin ikonunun marka paletine çekilmiş hali (ana ekran ikonuyla aynı aile).
  c: (id) => {
    const cub = [[300, 300], [410, 420], [520, 560], [630, 380], [740, 480]];
    const renk = [KOR, "#ee5a3f", SICAK, "#f6b896", KREM];
    return `
    <defs><radialGradient id="g${id}" cx="0.5" cy="0.32" r="0.75">
      <stop offset="0" stop-color="#3a120f"/><stop offset="0.55" stop-color="#16090f"/><stop offset="1" stop-color="${MUREKKEP}"/>
    </radialGradient></defs>
    <rect width="1080" height="1080" fill="url(#g${id})"/>
    ${cub.map(([x, h], i) => `<rect x="${x - 38}" y="${760 - h}" width="76" height="${h}" rx="38" fill="${renk[i]}"/>`).join("")}`;
  },
};

mkdirSync("/tmp/profil", { recursive: true });
const ciz = (svg, w) => new Resvg(svg, { fitTo: { mode: "width", value: w }, font: { fontFiles: FONT, loadSystemFonts: false } }).render().asPng();

// 1) Tek tek tam boy dosyalar (Instagram'a yüklenecek olan bunlar)
for (const [ad, f] of Object.entries(SECENEK)) {
  writeFileSync(`/tmp/profil/profil-${ad}.png`, ciz(`<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">${f(ad)}</svg>`, 1080));
}

// 2) Karşılaştırma: her seçenek daire içinde 3 boyutta (profil 300, akış 110, yorum 44)
const W = 1500, H = 1180;
let govde = `<rect width="${W}" height="${H}" fill="#f4f1ec"/>
  <text x="60" y="90" font-family="Instrument Sans" font-weight="700" font-size="44" fill="#1b1414">@necaliyor.co — profil resmi seçenekleri</text>
  <text x="60" y="135" font-family="Space Mono" font-size="20" fill="#7a6f6a">Instagram'ın gerçek boyutlarında, daireye kırpılmış: profil · akış · yorum</text>`;
const satirY = [200, 520, 840];
const etiket = { a: "A · Ş + canlı nokta", b: "B · kor zemin", c: "C · sinyal çubukları" };
Object.entries(SECENEK).forEach(([ad, f], i) => {
  const y = satirY[i];
  govde += `<text x="60" y="${y + 150}" font-family="Instrument Sans" font-weight="700" font-size="40" fill="#1b1414">${etiket[ad]}</text>`;
  [[620, 280], [1000, 110], [1220, 44]].forEach(([x, d], j) => {
    const cid = `k${ad}${j}`;
    govde += `<defs><clipPath id="${cid}"><circle cx="${x + d / 2}" cy="${y + 140}" r="${d / 2}"/></clipPath></defs>
      <g clip-path="url(#${cid})"><g transform="translate(${x} ${y + 140 - d / 2}) scale(${d / 1080})">${f(`${ad}${j}`)}</g></g>`;
  });
});
writeFileSync("/tmp/profil/karsilastirma.png", ciz(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${govde}</svg>`, W));
console.log("HAZIR: /tmp/profil/{profil-a,profil-b,profil-c,karsilastirma}.png");
