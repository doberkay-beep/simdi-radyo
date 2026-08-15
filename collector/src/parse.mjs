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
