// ŞİMDİ — TÜRKİYE RADYO ENDEKSİ (aylık basın raporu; her ayın 1'i 10:00 TR).
// Veri TEK KAYNAKTAN: sitedeki /endeks sayfası ve açık veri ile aynı
// endeks_ozet RPC'si — kart, sayfa ve JSON hep aynı sayıyı söyler.
//   node endeks.mjs            → geçen takvim ayı (TR saatiyle)
//   node endeks.mjs 2026-09    → belirli ay (düzeltme/yeniden üretim)
// Çıktılar: /opt/simdi/rapor/cikti/endeks-YYYY-MM.{png,md,json}
import { createClient } from "@supabase/supabase-js";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("/opt/simdi-collector/.env.local", "utf8")
    .split("\n").filter((s) => s.includes("="))
    .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1).trim()]),
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

// Yeni ay (argümansız, ayın 1'i): endeks_dondur hesaplar ve endeks_arsiv'e YAZAR — site ve
// açık veri bundan sonra hep bu donmuş sonucu gösterir. Belirli ay argümanla verilirse
// (kartı yeniden çizmek için) donmuş kayıt OKUNUR, üzerine yazılmaz.
const yenidenCiz = /^\d{4}-\d{2}$/.test(process.argv[2] ?? "");
const { data: o, error } = yenidenCiz
  ? await sb.rpc("endeks_ozet", { p_ay: ay })
  : await sb.rpc("endeks_dondur", { p_ay: ay, p_aciklama: "aylık bot — otomatik yayın" });
if (error || !o?.liste?.length) { console.error("endeks alınamadı:", error?.message ?? "boş"); process.exit(1); }
const { liste, toplam, sanatci } = o;

const kacis = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const kes = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

const satirlar = liste.slice(0, 10).map((s, i) => {
  const y = 470 + i * 78;
  const buyuk = i < 3;
  return `
  <text x="96" y="${y}" font-family="Space Mono" font-weight="700" font-size="${buyuk ? 38 : 26}" fill="${buyuk ? "#ff9b76" : "#8d6f63"}" text-anchor="end">${i + 1}</text>
  <text x="128" y="${y - (buyuk ? 6 : 4)}" font-family="Instrument Sans" font-weight="700" font-size="${buyuk ? 32 : 26}" fill="#f2e6da">${kacis(kes(s.title, 30))}</text>
  <text x="128" y="${y + 24}" font-family="Instrument Sans" font-size="21" fill="#a08574">${kacis(kes(s.artist, 36))}</text>
  <text x="984" y="${y}" font-family="Space Mono" font-weight="700" font-size="21" fill="#e9b9a4" text-anchor="end">${s.kez} kez · ${s.istasyon} ist</text>`;
}).join("");

const svg = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12080e"/><stop offset="1" stop-color="#090507"/></linearGradient>
    <radialGradient id="kor" cx="0.5" cy="0.14" r="0.75"><stop offset="0" stop-color="#e5382c" stop-opacity="0.2"/><stop offset="1" stop-color="#e5382c" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#z)"/><rect width="1080" height="1350" fill="url(#kor)"/>
  <text x="540" y="130" font-family="Space Mono" font-weight="700" font-size="28" letter-spacing="12" fill="#e9b9a4" text-anchor="middle">TÜRKİYE RADYO ENDEKSİ</text>
  <text x="540" y="212" font-family="Instrument Sans" font-weight="700" font-size="64" fill="#f2e6da" text-anchor="middle">${kacis(ayAdi.toLocaleUpperCase("tr"))}</text>
  <text x="540" y="262" font-family="Fraunces" font-style="italic" font-size="28" fill="#c9b2a4" text-anchor="middle">türk radyolarında gerçekte en çok çalanlar — canlı arşivden</text>
  <text x="200" y="345" font-family="Space Mono" font-weight="700" font-size="40" fill="#ff9b76" text-anchor="middle">${Number(toplam).toLocaleString("tr-TR")}</text>
  <text x="200" y="378" font-family="Space Mono" font-size="17" letter-spacing="3" fill="#8d6f63" text-anchor="middle">KAYITLI ÇALMA</text>
  <text x="540" y="345" font-family="Instrument Sans" font-weight="700" font-size="34" fill="#ff9b76" text-anchor="middle">${kacis(kes(sanatci?.ad ?? "—", 18))}</text>
  <text x="540" y="378" font-family="Space Mono" font-size="17" letter-spacing="3" fill="#8d6f63" text-anchor="middle">AYIN SANATÇISI</text>
  <text x="880" y="345" font-family="Instrument Sans" font-weight="700" font-size="34" fill="#ff9b76" text-anchor="middle">${kacis(kes(liste[0].title, 18))}</text>
  <text x="880" y="378" font-family="Space Mono" font-size="17" letter-spacing="3" fill="#8d6f63" text-anchor="middle">AYIN ŞARKISI</text>
  ${satirlar}
  <text x="540" y="1272" font-family="Space Mono" font-weight="700" font-size="24" letter-spacing="7" fill="#e9b9a4" text-anchor="middle">necaliyor.co/endeks</text>
  <text x="540" y="1312" font-family="Fraunces" font-style="italic" font-size="21" fill="#6e564a" text-anchor="middle">bir yazarın radyo projesi · veri: ŞİMDİ canlı arşivi</text>
</svg>`;

mkdirSync("/opt/simdi/rapor/cikti", { recursive: true });
const png = new Resvg(svg, {
  fitTo: { mode: "width", value: 1080 },
  font: {
    fontFiles: ["/opt/simdi/rapor/SpaceMono-Bold.ttf", "/opt/simdi/rapor/InstrumentSans-Bold.ttf", "/opt/simdi/rapor/Fraunces-Italic.ttf"],
    loadSystemFonts: false,
  },
}).render().asPng();
writeFileSync(`/opt/simdi/rapor/cikti/endeks-${ay}.png`, png);

const md = `# TÜRKİYE RADYO ENDEKSİ — ${ayAdi}

necaliyor.co (ŞİMDİ) verilerine göre ${ayAdi} ayında Türk radyolarında:

**Ayın şarkısı:** ${liste[0].artist} — ${liste[0].title} (${liste[0].kez} kez, ${liste[0].istasyon} istasyon)
**Ayın sanatçısı:** ${sanatci?.ad ?? "—"} (ilk 25'te toplam ${sanatci?.kez ?? 0} çalınma)
**Kayıtlı çalma (Türk radyoları):** ${Number(toplam).toLocaleString("tr-TR")}

## İlk 10
${liste.slice(0, 10).map((s, i) => `${i + 1}. ${s.artist} — ${s.title} (${s.kez} kez · ${s.istasyon} istasyon)`).join("\n")}

---
Yöntem: ŞİMDİ, Türk radyolarını 25 saniyede bir dinleyip her parça değişimini
arşivler. Endeks yalnız Türkiye bandındaki aktif istasyonları ve en az 2 istasyonda
çalınmış şarkıları sayar; aynı yayını farklı adresten veren istasyonlar tek sayılır.
Canlı sayım ve ham veri: https://necaliyor.co/endeks
İletişim: do.berkay@icloud.com · Alıntı: "necaliyor.co Türkiye Radyo Endeksi"
`;
writeFileSync(`/opt/simdi/rapor/cikti/endeks-${ay}.md`, md);
writeFileSync(`/opt/simdi/rapor/cikti/endeks-${ay}.json`, JSON.stringify(o, null, 1));
console.log(`ENDEKS HAZIR — ${ayAdi}: ${liste[0].artist} — ${liste[0].title} zirvede; ${toplam} çalma; ayın sanatçısı ${sanatci?.ad}.`);
