// nowby. rapor kartları (1080×1350): siyah zemin, tek kızıl, Bodoni Moda + Newsreader.
const ZEMIN = "#0a0a0a", YAZI = "#f5f3ef", SOLUK = "#9b9a96", KIZIL = "#e5382c", CIZGI = "#2a2a2a";
const BASLIK = 'font-family="Bodoni Moda"';
const METIN = 'font-family="Newsreader" font-style="italic"';

export const kacis = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const kes = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
export const FONTLAR = ["/opt/simdi/rapor/BodoniModa-Regular.ttf", "/opt/simdi/rapor/Newsreader-Italic.ttf"];

export function kartSvg({ ust, baslik, alt, ozet = [], liste, adres }) {
  const varOzet = ozet.length > 0;
  const bas = varOzet ? 492 : 408;
  const adim = varOzet ? 74 : 82;
  const ozetler = ozet.map((o, i) => {
    const x = [84, 420, 730][i];
    return `<text x="${x}" y="372" ${BASLIK} font-size="${i === 0 ? 46 : 36}" fill="${i === 0 ? KIZIL : YAZI}">${kacis(o.deger)}</text>
  <text x="${x}" y="410" ${METIN} font-size="24" fill="${SOLUK}">${kacis(o.etiket)}</text>`;
  }).join("\n  ");
  const satirlar = liste.slice(0, 10).map((s, i) => {
    const y = bas + i * adim;
    return `<text x="136" y="${y}" ${BASLIK} font-size="36" fill="${i === 0 ? KIZIL : SOLUK}" text-anchor="end">${i + 1}</text>
  <text x="164" y="${y - 4}" ${BASLIK} font-size="32" fill="${YAZI}">${kacis(kes(s.title, 34))}</text>
  <text x="164" y="${y + 26}" ${METIN} font-size="23" fill="${SOLUK}">${kacis(kes(s.artist, 44))}</text>
  <text x="996" y="${y}" ${METIN} font-size="24" fill="${SOLUK}" text-anchor="end">${s.kez} kez · ${s.istasyon} radyo</text>`;
  }).join("\n  ");
  return `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1350" fill="${ZEMIN}"/>
  <text x="84" y="116" ${METIN} font-size="30" fill="${SOLUK}">${kacis(ust)}</text>
  <text x="84" y="228" ${BASLIK} font-size="100" letter-spacing="-2" fill="${YAZI}">${kacis(baslik)}</text>
  <text x="84" y="282" ${METIN} font-size="30" fill="${SOLUK}">${kacis(alt)}</text>
  ${ozetler}
  ${satirlar}
  <rect x="84" y="1234" width="912" height="1" fill="${CIZGI}"/>
  <text x="84" y="1296" ${BASLIK} font-size="46" fill="${YAZI}">nowby<tspan fill="${KIZIL}">.</tspan></text>
  <text x="996" y="1296" ${METIN} font-size="30" fill="${SOLUK}" text-anchor="end">${kacis(adres)}</text>
</svg>`;
}

// Site verisini Hetzner arşivinden okur; ulaşılamazsa Supabase'e düşer.
export async function rpc(ad, govde) {
  try {
    const r = await fetch(`http://127.0.0.1:3010/rest/v1/rpc/${ad}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(govde),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`arşiv ${r.status}`);
    return await r.json();
  } catch (e) {
    console.error(`arşiv okunamadı (${e.message}), Supabase deneniyor`);
    const { readFileSync } = await import("node:fs");
    const { createClient } = await import("@supabase/supabase-js");
    const env = Object.fromEntries(
      readFileSync("/opt/simdi-collector/.env.local", "utf8")
        .split("\n").filter((s) => s.includes("="))
        .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1).trim()]),
    );
    const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.rpc(ad, govde);
    if (error) throw new Error(error.message);
    return data;
  }
}
