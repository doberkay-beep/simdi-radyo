// ŞİMDİ — "sinyal çubukları" marka işareti (Berkay seçti, 3 Eki 2026).
// Tek kaynaktan: Instagram profil (1080) + site ikonları (icon 512, apple-icon 180).
// Çubuklar optik olarak ortalı; daire kırpmada ve maskable ikonda güvenli alanda.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";

const MUREKKEP = "#0b0708";
const RENK = ["#e5382c", "#ee5a3f", "#ff9b76", "#f6b896", "#f2e6da"]; // kor → krem
const BOY = [300, 420, 560, 380, 480];                                   // sinyal ritmi

function isaret() {
  const gen = 76, ara = 110, toplamG = ara * 4 + gen;           // 516
  const x0 = (1080 - toplamG) / 2;                              // yatay ortalı
  const ust = Math.max(...BOY), taban = 540 + ust / 2;          // dikey ortalı (en uzun çubuğa göre)
  const cubuklar = BOY.map((h, i) =>
    `<rect x="${x0 + i * ara}" y="${taban - h}" width="${gen}" height="${h}" rx="${gen / 2}" fill="${RENK[i]}"/>`).join("");
  return `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g" cx="0.5" cy="0.32" r="0.75">
      <stop offset="0" stop-color="#3a120f"/><stop offset="0.55" stop-color="#16090f"/><stop offset="1" stop-color="${MUREKKEP}"/>
    </radialGradient></defs>
    <rect width="1080" height="1080" fill="url(#g)"/>${cubuklar}</svg>`;
}

mkdirSync("/tmp/sinyal", { recursive: true });
const svg = isaret();
for (const [ad, w] of [["profil-instagram", 1080], ["icon", 512], ["apple-icon", 180]]) {
  writeFileSync(`/tmp/sinyal/${ad}.png`, new Resvg(svg, { fitTo: { mode: "width", value: w } }).render().asPng());
}
console.log("HAZIR: /tmp/sinyal/{profil-instagram,icon,apple-icon}.png");
