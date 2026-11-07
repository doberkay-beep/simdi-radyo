// nowby. Türkiye Radyo Endeksi: aylık basın raporu (her ayın 1'i 10:00 TR).
// Veri sitedeki /endeks ile aynı endeks_ozet işlevinden gelir. Biten ay, arşivdeki saatlik
// endeks_canli_yaz işiyle zaten dondurulmuştur; bu betik yalnız okur ve dosya yazar, hiçbir yere göndermez.
//   node endeks.mjs            → geçen takvim ayı (TR saatiyle)
//   node endeks.mjs 2026-10    → belirli ay (yeniden üretim)
// Çıktılar: /opt/simdi/rapor/cikti/endeks-YYYY-MM.{png,md,json}
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { kartSvg, kes, FONTLAR, rpc } from "./kart.mjs";

function gecenAy() {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" })
    .format(new Date()).split("-").map(Number);
  const gy = m === 1 ? y - 1 : y, gm = m === 1 ? 12 : m - 1;
  return `${gy}-${String(gm).padStart(2, "0")}`;
}
const ay = /^\d{4}-\d{2}$/.test(process.argv[2] ?? "") ? process.argv[2] : gecenAy();
const [yy, mm] = ay.split("-").map(Number);
const ayAdi = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "Europe/Istanbul" })
  .format(new Date(Date.UTC(yy, mm - 1, 15)));

let o;
try {
  o = await rpc("endeks_ozet", { p_ay: ay });
} catch (e) {
  console.error("endeks alınamadı:", e.message);
  process.exit(1);
}
if (!o?.liste?.length) { console.error("endeks alınamadı: boş"); process.exit(1); }
const { liste, toplam, sanatci } = o;
const sayi = Number(toplam).toLocaleString("tr-TR");

const svg = kartSvg({
  ust: "Türkiye Radyo Endeksi",
  baslik: ayAdi,
  alt: "Türkiye radyolarında en çok çalanlar, canlı arşivden",
  ozet: [
    { deger: sayi, etiket: "kayıtlı çalma" },
    { deger: kes(sanatci?.ad ?? "—", 14), etiket: "ayın sanatçısı" },
    { deger: kes(liste[0].title, 14), etiket: "ayın şarkısı" },
  ],
  liste,
  adres: "nowby.co/endeks",
});

mkdirSync("/opt/simdi/rapor/cikti", { recursive: true });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1080 }, font: { fontFiles: FONTLAR, loadSystemFonts: false } }).render().asPng();
writeFileSync(`/opt/simdi/rapor/cikti/endeks-${ay}.png`, png);

const md = `# Türkiye Radyo Endeksi: ${ayAdi}

nowby.co verilerine göre ${ayAdi} ayında Türkiye radyolarında:

**Ayın şarkısı:** ${liste[0].artist} — ${liste[0].title} (${liste[0].kez} kez, ${liste[0].istasyon} radyo)
**Ayın sanatçısı:** ${sanatci?.ad ?? "—"} (ilk 25'te toplam ${sanatci?.kez ?? 0} çalınma)
**Kayıtlı çalma:** ${sayi}

## İlk 10
${liste.slice(0, 10).map((s, i) => `${i + 1}. ${s.artist} — ${s.title} (${s.kez} kez, ${s.istasyon} radyo)`).join("\n")}

---
Yöntem: nowby, Türkiye radyolarının yayınladığı şarkı bilgisini düzenli aralıklarla okuyup her parça değişimini
arşivler. Sıralama yalnız Türkiye bandındaki aktif radyoları ve en az 2 radyoda çalınmış şarkıları sayar;
jingle ve reklam kayıtları sıralamadan elenir. Kayıtlı çalma sayısı süzülmemiş tüm kayıtlardır.
Canlı sayım ve ham veri: https://nowby.co/endeks
İletişim: hello@berkaydogan.co · Alıntı: "nowby.co Türkiye Radyo Endeksi"
`;
writeFileSync(`/opt/simdi/rapor/cikti/endeks-${ay}.md`, md);
writeFileSync(`/opt/simdi/rapor/cikti/endeks-${ay}.json`, JSON.stringify(o, null, 1));
console.log(`ENDEKS HAZIR: ${ayAdi}: ${liste[0].artist} — ${liste[0].title} zirvede; ${toplam} çalma; ayın sanatçısı ${sanatci?.ad}.`);
