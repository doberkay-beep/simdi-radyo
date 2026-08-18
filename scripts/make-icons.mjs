// ŞİMDİ marka işareti üreteci (bağımsız, harici paket yok).
// Ekolayzer çubukları (uygulamadaki "eq" animasyonuyla aynı dil) koyu zeminde.
// Çıktılar: mobil ikon/splash + web favicon. Metin YOK (marka = işaret).
//
// Çalıştır (repo kökünden):  node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- küçük PNG kodlayıcı (RGBA, 8-bit) ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit derinliği
  ihdr[9] = 6; // renk tipi: RGBA
  // raw: her satır başına filtre baytı (0)
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- çizim (SS kat kadar süper örnekle, kutu ile küçült → yumuşak kenar) ---
const SS = 3;
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function mixColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// Yuvarlak köşeli dikey çubuk (yüksek çözünürlük tamponuna yaz).
function fillBar(buf, W, H, x, y, bw, bh, col) {
  const r = bw / 2; // uçlar tam yuvarlak
  const x0 = Math.max(0, Math.floor(x));
  const x1 = Math.min(W, Math.ceil(x + bw));
  const y0 = Math.max(0, Math.floor(y));
  const y1 = Math.min(H, Math.ceil(y + bh));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      // Yuvarlak dikdörtgen içi mi?
      const cx = px + 0.5;
      const cy = py + 0.5;
      let inside = cx >= x && cx <= x + bw && cy >= y && cy <= y + bh;
      // üst/alt yuvarlak uçlar
      if (inside) {
        if (cy < y + r) {
          const dx = cx - (x + r);
          const dy = cy - (y + r);
          if (Math.abs(dx) > r || dx * dx + dy * dy > r * r) inside = false;
        } else if (cy > y + bh - r) {
          const dx = cx - (x + r);
          const dy = cy - (y + bh - r);
          if (Math.abs(dx) > r || dx * dx + dy * dy > r * r) inside = false;
        }
      }
      if (inside) {
        const i = (py * W + px) * 4;
        buf[i] = col[0];
        buf[i + 1] = col[1];
        buf[i + 2] = col[2];
        buf[i + 3] = 255;
      }
    }
  }
}

// İşareti üret: N×N, isteğe bağlı koyu zemin, ortada 5 ekolayzer çubuğu.
function makeMark(size, { bg = null, pad = 0.2 } = {}) {
  const W = size * SS;
  const H = size * SS;
  const hi = Buffer.alloc(W * H * 4); // hepsi şeffaf
  if (bg) {
    const [r, g, b] = hexToRgb(bg);
    for (let i = 0; i < W * H; i++) {
      hi[i * 4] = r;
      hi[i * 4 + 1] = g;
      hi[i * 4 + 2] = b;
      hi[i * 4 + 3] = 255;
    }
  }

  // Çubuk alanı (kare içinde ortalanmış, kenar boşluğu = pad)
  const area = W * (1 - pad * 2);
  const areaX = W * pad;
  const areaY = H * pad;
  const bars = [0.5, 0.78, 1.0, 0.62, 0.86]; // yükseklik oranları
  const gapRatio = 0.55; // çubuk genişliğine göre boşluk
  const n = bars.length;
  const unit = area / (n + (n - 1) * gapRatio);
  const bw = unit;
  const gap = unit * gapRatio;
  const c1 = hexToRgb("#ff8a5b"); // gül-turuncu
  const c2 = hexToRgb("#ffd24d"); // altın

  for (let k = 0; k < n; k++) {
    const bh = area * bars[k];
    const x = areaX + k * (bw + gap);
    const y = areaY + (area - bh); // alttan hizalı
    const col = mixColor(c1, c2, n === 1 ? 0 : k / (n - 1));
    fillBar(hi, W, H, x, y, bw, bh, col);
  }

  // Kutu küçültme (SS×SS ortalama, ön-çarpımlı → doğru şeffaf kenar)
  const out = Buffer.alloc(size * size * 4);
  const n2 = SS * SS;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let pr = 0, pg = 0, pb = 0, pa = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * W + (x * SS + sx)) * 4;
          const af = hi[i + 3] / 255;
          pr += hi[i] * af;
          pg += hi[i + 1] * af;
          pb += hi[i + 2] * af;
          pa += hi[i + 3];
        }
      }
      const o = (y * size + x) * 4;
      const alpha = pa / n2; // 0..255
      if (alpha > 0) {
        const f = 255 / pa; // ön-çarpımdan çöz (pr toplamı zaten af ile çarpılı)
        out[o] = Math.min(255, Math.round(pr * f));
        out[o + 1] = Math.min(255, Math.round(pg * f));
        out[o + 2] = Math.min(255, Math.round(pb * f));
      }
      out[o + 3] = Math.round(alpha);
    }
  }
  return encodePng(size, size, out);
}

function save(rel, buf) {
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, buf);
  console.log(`  ${rel}  (${(buf.length / 1024).toFixed(1)} KB)`);
}

const BG = "#0a0a0b";
console.log("İşaretler üretiliyor…");
// Mobil (tam kare, koyu zemin — iOS zaten köşe yuvarlar)
save("mobile/assets/icon.png", makeMark(1024, { bg: BG, pad: 0.22 }));
// Android uyarlanabilir ön plan (şeffaf, biraz daha küçük güvenli alan)
save("mobile/assets/adaptive-icon.png", makeMark(1024, { bg: null, pad: 0.3 }));
// Splash görseli (şeffaf, zemine oturur)
save("mobile/assets/splash-icon.png", makeMark(1024, { bg: null, pad: 0.28 }));
// Web favicon + apple ikonu (koyu zemin)
save("web/app/icon.png", makeMark(512, { bg: BG, pad: 0.22 }));
save("web/app/apple-icon.png", makeMark(180, { bg: BG, pad: 0.2 }));
console.log("Bitti.");
