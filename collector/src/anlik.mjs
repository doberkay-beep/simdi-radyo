// "Şu an çalan"ın anlık kopyası: toplayıcı bellekte tutar, en fazla saniyede bir
// küçük bir JSON dosyasına yazar; Hetzner'deki nginx bunu sunar, nowby.co/api/now
// veritabanına gitmeden buradan okur (22 Eki IO kesintisi sonrası).
import { writeFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const YOL = process.env.ANLIK_YOL || "/var/www/canli/now.json";
const durum = new Map(); // slug → { artist, title, rawTitle, updatedAt }
let zamanlayici = null;

/** Bir istasyonun çalanını işaretler. Ayrıştırılamayan başlıkta sanatçı ≡ başlık olur; ekranda yalnız başlık kalsın. */
export function anlikKoy(slug, parsed, updatedAt = new Date().toISOString()) {
  const title = parsed.title || parsed.raw_title || null;
  const artist = parsed.artist && parsed.artist !== title ? parsed.artist : null;
  durum.set(slug, { artist, title, rawTitle: parsed.raw_title || null, updatedAt });
  if (!zamanlayici) zamanlayici = setTimeout(yaz, 1000);
}

/** Donmuş başlıklı istasyonu anlık kopyadan çıkarır; uygulamada yalnız istasyon adı görünür. */
export function anlikKaldir(slug) {
  if (durum.delete(slug) && !zamanlayici) zamanlayici = setTimeout(yaz, 1000);
}

async function yaz() {
  zamanlayici = null;
  const govde = JSON.stringify({ at: new Date().toISOString(), stations: Object.fromEntries(durum) });
  try {
    await mkdir(dirname(YOL), { recursive: true });
    const gecici = `${YOL}.tmp`;
    await writeFile(gecici, govde);
    await rename(gecici, YOL); // okuyan hiçbir zaman yarım dosya görmez
  } catch (err) {
    console.log(new Date().toISOString(), "! anlık dosya yazılamadı:", err.message);
  }
}
