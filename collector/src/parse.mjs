// raw_title'ı sanatçı/parça olarak ayırır (brief Faz 1 kuralı).
// İlk " - " karakterinden böler. Bölünemezse ikisi de raw_title olur.

export function parseTitle(rawTitle) {
  const raw = (rawTitle || "").trim();
  const i = raw.indexOf(" - ");
  if (i === -1) {
    return { artist: raw, title: raw, raw_title: raw };
  }
  const artist = raw.slice(0, i).trim();
  const title = raw.slice(i + 3).trim();
  // Bir taraf boş kaldıysa bölme başarısız — ikisi de ham başlık.
  if (!artist || !title) {
    return { artist: raw, title: raw, raw_title: raw };
  }
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
  "adw_ad", "adcontext", "advertisement", "ad break", "spot reklam",
  "reklam kuşağı", "reklam kusagi",
];

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

  const l = low(s);

  // Sadece bir URL ise çöp.
  if (/^(https?:\/\/|www\.)\S+$/i.test(s)) return "";
  // Bilinen çöp kalıpları.
  if (JUNK_EXACT.has(l)) return "";
  if (JUNK_INCLUDES.some((j) => l.includes(j))) return "";
  // İstasyon adının kendisi (marka), parça değil.
  if (stationName && l === low(stationName)) return "";

  s = dedupeDoubled(s);
  return s.trim();
}
