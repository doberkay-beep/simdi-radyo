// nowby. haftalık radyo raporu (her cuma 12:00 TR): son 7 günün en çok çalan 10 şarkısı.
// Paylaşımlık kart ve duyuru metni üretir; yalnız dosya yazar, hiçbir yere göndermez.
// Çıktılar: /opt/simdi/rapor/cikti/rapor-YYYYMMDD.{png,txt}
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { kartSvg, FONTLAR, rpc } from "./kart.mjs";

const sona = new Date();
const bastan = new Date(sona.getTime() - 7 * 86400_000);
let liste;
try {
  liste = (await rpc("liste_araligi", { bastan: bastan.toISOString(), sona: sona.toISOString(), adet: 10 })) ?? [];
} catch (e) {
  console.error("liste alınamadı:", e.message);
  process.exit(1);
}
if (liste.length < 3) { console.error("liste çok kısa, rapor atlandı"); process.exit(1); }

const gunAy = (d) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(d);
const aralikYazi = `${gunAy(bastan)} – ${gunAy(sona)}`;

const svg = kartSvg({
  ust: "Haftanın radyo raporu",
  baslik: "nowby. Listesi",
  alt: `${aralikYazi} · Türkiye radyolarında en çok çalanlar`,
  liste,
  adres: "nowby.co/liste",
});
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1080 }, font: { fontFiles: FONTLAR, loadSystemFonts: false } }).render().asPng();

const damga = new Date().toISOString().slice(0, 10).replace(/-/g, "");
mkdirSync("/opt/simdi/rapor/cikti", { recursive: true });
writeFileSync(`/opt/simdi/rapor/cikti/rapor-${damga}.png`, png);

const metin = `Haftanın radyo raporu (${aralikYazi})

Türkiye radyolarında bu hafta zirve:
1. ${liste[0].artist} — ${liste[0].title} (${liste[0].kez} kez, ${liste[0].istasyon} radyo)
2. ${liste[1].artist} — ${liste[1].title}
3. ${liste[2].artist} — ${liste[2].title}

Canlı sayım: nowby.co/liste
Senin sanatçın kaç kez çaldı?`;
writeFileSync(`/opt/simdi/rapor/cikti/rapor-${damga}.txt`, metin);
console.log(`rapor üretildi: rapor-${damga}.png/.txt (zirve: ${liste[0].artist} — ${liste[0].title})`);
