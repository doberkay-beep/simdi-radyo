// HLS başlığı: bazı yayınlar (radyotvonline "/hls/play/…m3u8") ICY vermez, çalanı
// parça listesindeki #EXTINF satırına yazar: "#EXTINF:2.99,Sanatçı - Şarkı,kapak-url".
// Ana liste → değişken liste → son EXTINF. Ses indirilmez, yalnız iki küçük metin okunur.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

export const hlsBaslikli = (url) => /\/hls\/play\/[^/?]+\.m3u8(\?|$)/i.test(url || "");

async function metin(url, timeout) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(timeout) });
  if (r.status === 429) return { durum: 429 };
  if (!r.ok) throw new Error(`http-${r.status}`);
  return { govde: await r.text() };
}

export function extinfBaslik(liste) {
  const satirlar = liste.split(/\r?\n/).filter((l) => l.startsWith("#EXTINF:"));
  const son = satirlar.at(-1);
  if (!son) return null;
  const virgul = son.indexOf(",");
  if (virgul < 0) return null;
  let baslik = son.slice(virgul + 1);
  // Sonda kapak adresi: ",https://…"
  baslik = baslik.replace(/,\s*https?:\/\/\S*$/i, "").trim();
  return baslik || null;
}

export async function probeHls(url, { timeout = 8000 } = {}) {
  try {
    const ana = await metin(url, timeout);
    if (ana.durum === 429) return { status: "dead", reason: "http-429" };
    let liste = ana.govde;
    if (!/#EXTINF:/.test(liste)) {
      const alt = liste.split(/\r?\n/).find((l) => l && !l.startsWith("#"));
      if (!alt) return { status: "none", reason: "hls-alt-liste-yok" };
      const r = await metin(new URL(alt, url).href, timeout);
      if (r.durum === 429) return { status: "dead", reason: "http-429" };
      liste = r.govde;
    }
    const title = extinfBaslik(liste);
    return title ? { status: "ok", title } : { status: "none", reason: "hls-baslik-yok" };
  } catch (err) {
    return { status: "dead", reason: err?.message || "hls-hata" };
  }
}
