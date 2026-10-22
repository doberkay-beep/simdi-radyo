// raw_title'ı sanatçı/parça olarak ayırır (brief Faz 1 kuralı).
// İlk " - " karakterinden böler. Bölünemezse ikisi de raw_title olur.

// Ayraçlar öncelik sırasıyla; ilk eşleşenden bölünür. "Sanatçı- Şarkı" gibi
// yalnız sağı boşluklu tire de ayraç sayılır (ör. "Ceylan- Hep Ezildim").
const AYRACLAR = [" - ", " – ", " — ", " ˗ ", " * "];

export function parseTitle(rawTitle) {
  const raw = (rawTitle || "").trim();
  let artist = "", title = "";
  for (const a of AYRACLAR) {
    const i = raw.indexOf(a);
    if (i !== -1) { artist = raw.slice(0, i).trim(); title = raw.slice(i + a.length).trim(); break; }
  }
  if (!artist || !title) {
    const m = raw.match(/^(.*?\S)- (\S.*)$/u);
    if (m) { artist = m[1].trim(); title = m[2].trim(); }
  }
  // Bölünemediyse ikisi de ham başlık (arşiv şeması böyle bekliyor; ekranda
  // sanatçı ≡ başlık ise yalnız başlık gösterilir, bkz. anlik.mjs).
  if (!artist || !title) return { artist: raw, title: raw, raw_title: raw };
  return { artist, title, raw_title: raw };
}

// Anlamsız (reklam/istasyon adı/URL) başlık kalıpları. Yüksek isabet: yalnızca
// neredeyse kesin çöp olanları ele; gerçek parçayı yanlışlıkla düşürme.
const JUNK_EXACT = new Set([
  "unknown", "n/a", "na", "-", "--", "...", "no title", "notitle",
  "bilgi yok", "reklam", "reklamlar", "canlı yayın", "canli yayin",
  "live", "live stream", "livestream", "default", "default title",
]);
const JUNK_INCLUDES = [
  "adw_ad", "adcontext", "advertisement", "ad break", "ad_break", "spot reklam",
  "reklam kuşağı", "reklam kusagi", "empty playlist", "now playing info goes here",
  "will continue after this break", "station will continue",
];

// İstasyon adının çekirdeği: "Radyo Kent" ≡ "Kent Fm" ≡ "kent".
const marka = (s) => low(s).replace(/\b(radyo|radio|fm|tv|online|stream)\b/g, "").replace(/[^a-z0-9çğıöşü]/g, "");

// XML gönderen yayınlardan (Dalet RadioInfo) sanatçı ve parçayı çıkar.
function xmldenBaslik(s) {
  const al = (etiket) => s.match(new RegExp(`<${etiket}>([^<]+)</${etiket}>`))?.[1]?.trim() || "";
  const sanatci = al("DB_DALET_ARTIST_NAME") || al("DB_LEAD_ARTIST_NAME");
  const parca = al("DB_DALET_TITLE_NAME") || al("DB_SONG_NAME");
  return sanatci && parca ? `${sanatci} - ${parca}` : "";
}

// tr-özel küçük harf + boşlukları sadeleştir.
const low = (s) => s.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr");

// Aynı başlığın iki kez yapışmasını düzelt: "A - B - A - B" → "A - B".
function dedupeDoubled(s) {
  const parts = s.split(" - ");
  if (parts.length >= 2 && parts.length % 2 === 0) {
    const half = parts.length / 2;
    const a = parts.slice(0, half).join(" - ");
    const b = parts.slice(half).join(" - ");
    if (low(a) === low(b) && a) return a;
  }
  // Ayraçsız birebir tekrar: "Şarkı Şarkı" → "Şarkı".
  const trimmed = s.trim();
  if (trimmed.length % 2 === 1) {
    const mid = (trimmed.length - 1) / 2;
    if (trimmed[mid] === " ") {
      const a = trimmed.slice(0, mid);
      const b = trimmed.slice(mid + 1);
      if (low(a) === low(b) && a) return a;
    }
  }
  return s;
}

// Ham başlığı temizle. Çöpse "" döndür (worker bunu "yazma" diye yorumlar).
export function normalizeTitle(rawTitle, stationName = "") {
  let s = (rawTitle || "").replace(/\s+/g, " ").trim();
  if (!s) return "";

  // Yaygın önekleri at: "Now Playing:", "Şimdi Çalıyor:", "Çalan:".
  s = s.replace(/^(now playing|şimdi çalıyor|simdi caliyor|çalan|calan|nowplaying)\s*[:\-–]\s*/i, "").trim();
  if (!s) return "";

  // XML/HTML parçası gönderen yayınlar (ör. radio-comercial): içinden parçayı çıkar, yoksa çöp.
  if (/^<(\?xml|[a-z!])/i.test(s)) { s = xmldenBaslik(s); if (!s) return ""; }
  // Boşluksuz "+" ile yapışık program adları (Free+FMRokola+I) ve yalnız alt çizgi → çöp.
  if (!/\s/.test(s) && /\+/.test(s)) return "";
  if (/^[_\W]+$/u.test(s)) return "";
  // Yayın yazılımının eklediği sayaçlar: "Kesik Çayır@12022" → "Kesik Çayır".
  s = s.replace(/@\d+\b/g, "").replace(/\s+/g, " ").trim();
  // Sonda/başta sarkan ayraç: "Extreme Deep House Radio -" → "Extreme Deep House Radio".
  s = s.replace(/^\s*[-–—]\s*/, "").replace(/\s*[-–—]\s*$/, "").trim();
  if (!s) return "";
  // "Şarkı~Sanatçı~~1970~~151~2026-10-04T02:09:15~…" gibi ~ ile ayrılmış, içinde
  // sayaç/zaman damgası taşıyan biçim: her yoklamada değişip aynı parçayı
  // tekrar tekrar yazdırıyordu (italia-italia-70). Kararlı "Sanatçı - Şarkı"ya indir.
  if (/~/.test(s) && /\d{4}-\d\d-\d\dT\d\d:\d\d|~~/.test(s)) {
    const [baslik, sanatci] = s.split("~").map((x) => x.trim());
    s = sanatci && baslik ? `${sanatci} - ${baslik}` : baslik || "";
    if (!s) return "";
  }
  const l = low(s);

  // Sadece bir URL ise çöp.
  if (/^(https?:\/\/|www\.)\S+$/i.test(s)) return "";
  // Bilinen çöp kalıpları.
  if (JUNK_EXACT.has(l)) return "";
  if (JUNK_INCLUDES.some((j) => l.includes(j))) return "";
  // Boşluksuz alt çizgili başlık (çöp kontrolünden sonra): "Enta_Maghroor" → "Enta Maghroor".
  if (!/\s/.test(s) && /_/.test(s)) s = s.replace(/_+/g, " ").trim();
  // İstasyon adının kendisi (marka), parça değil.
  if (stationName && (low(s) === low(stationName) || (marka(s) && marka(s) === marka(stationName)))) return "";

  s = dedupeDoubled(s);
  return s.trim();
}
