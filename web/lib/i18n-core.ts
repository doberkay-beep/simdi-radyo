// Sunucu + istemci ortak i18n çekirdeği (bu dosyada "use client" YOK, böylece
// sunucu bileşenleri de içeri aktarabilir). İstemci tarafı hook'lar i18n.ts'te.

export type Dil = "tr" | "en";

export const SOZLUK: Record<string, { tr: string; en: string }> = {
  // gezinme
  "nav.kesif": { tr: "keşif", en: "discover" },
  "nav.kose": { tr: "köşe", en: "essays" },
  "nav.nabiz": { tr: "nabız", en: "pulse" },
  "nav.arsiv": { tr: "arşiv →", en: "archive →" },
  "nav.gelistirici": { tr: "geliştirici", en: "about" },
  "nav.simdi": { tr: "← şimdi", en: "← now" },
  "nav.canli": { tr: "canlı", en: "live" },
  "nav.tumRadyolar": { tr: "← tüm radyolar", en: "← all stations" },
  // ana ekran
  "home.ara": { tr: "İstasyon ara…  (/ ile hızlı ara, boşluk çal/dur)", en: "Search stations…  (/ to focus, space to play/pause)" },
  "home.tumu": { tr: "tümü", en: "all" },
  "home.favoriler": { tr: "favoriler", en: "favorites" },
  "home.hepsi": { tr: "hepsi", en: "all" },
  "home.turkiye": { tr: "Türkiye", en: "Turkey" },
  "home.dunya": { tr: "dünya", en: "world" },
  "home.simdiCalanlar": { tr: "şu an çalanlar", en: "playing now" },
  // nabız
  "nabiz.baslik1": { tr: "Radyo", en: "Radio" },
  "nabiz.baslik2": { tr: "Nabzı", en: "Pulse" },
  "nabiz.alt": { tr: "Türk radyosunun kalp atışı — canlı.", en: "The heartbeat of Turkish radio — live." },
  "nabiz.ruhHali": { tr: "şu an Türkiye'nin ruh hali", en: "Turkey's mood right now" },
  "nabiz.eszamanli": { tr: "şu an birden fazla istasyonda", en: "on multiple stations right now" },
  "nabiz.enCok": { tr: "son 24 saatte en çok çalanlar", en: "most played in the last 24h" },
  "nabiz.sanatcilar": { tr: "en çok çalan sanatçılar (24 saat)", en: "most played artists (24h)" },
  "nabiz.yukselen": { tr: "yükselen ↑", en: "rising ↑" },
  "nabiz.hareketliSaat": { tr: "en hareketli saat (7 gün)", en: "busiest hour (7 days)" },
  // keşif
  "kesif.baslik": { tr: "Keşif", en: "Discover" },
  "kesif.alt": { tr: "rastlantıya bırak — bir frekans seni bulsun.", en: "leave it to chance — let a frequency find you." },
  "kesif.gununIst": { tr: "günün istasyonu", en: "station of the day" },
  "kesif.zar": { tr: "zar at", en: "roll the dice" },
  "kesif.rastgele": { tr: "🎲 rastgele", en: "🎲 random" },
  "kesif.enSevilen": { tr: "en sevilenler ♥", en: "most loved ♥" },
  "kesif.ruhHali": { tr: "ruh haline göre", en: "by mood" },
  "kesif.tureGore": { tr: "türe göre gez", en: "browse by genre" },
  "kesif.yukleniyor": { tr: "istasyonlar getiriliyor…", en: "loading stations…" },
  "kesif.hata": { tr: "Getirilemedi. Birazdan tekrar dene.", en: "Couldn't load. Try again shortly." },
  "kesif.zarBos": { tr: "zarı at, bir yere düşsün.", en: "roll the dice, let it land." },
  "kesif.ruhBos": { tr: "bu ruhta istasyon yok.", en: "no station for this mood." },
  // ruh halleri
  "ruh.sakin": { tr: "sakin", en: "calm" },
  "ruh.enerjik": { tr: "enerjik", en: "energetic" },
  "ruh.hüzünlü": { tr: "hüzünlü", en: "melancholic" },
  "ruh.odak": { tr: "odak", en: "focus" },
  "ruh.sakin.alt": { tr: "yavaşla, derin bir nefes", en: "slow down, breathe deep" },
  "ruh.enerjik.alt": { tr: "sesi aç, hızlan", en: "turn it up, speed up" },
  "ruh.hüzünlü.alt": { tr: "biraz dert, biraz şehir", en: "a little sorrow, a little city" },
  "ruh.odak.alt": { tr: "çalış, oku, dal", en: "work, read, dive in" },
  // arşiv
  "arsiv.alt": { tr: "o an radyoda ne çalıyordu", en: "what was on the radio then" },
  "arsiv.goster": { tr: "Göster", en: "Show" },
  "arsiv.ara": { tr: "arşivde parça / sanatçı ara…", en: "search archive for song / artist…" },
  "arsiv.araBtn": { tr: "ara", en: "search" },
  "arsiv.temizle": { tr: "temizle", en: "clear" },
  "arsiv.gecmiste": { tr: "geçmişte bugün", en: "on this day" },
  "arsiv.dun": { tr: "dün", en: "yesterday" },
  "arsiv.haftaOnce": { tr: "1 hafta önce", en: "1 week ago" },
  "arsiv.ayOnce": { tr: "1 ay önce", en: "1 month ago" },
  "arsiv.yilOnce": { tr: "1 yıl önce", en: "1 year ago" },
  "arsiv.simdiye": { tr: "şimdiye dön", en: "back to now" },
  // radyo sayfası
  "radyo.simdiCaliyor": { tr: "şu an çalıyor", en: "playing now" },
  "radyo.canliYayin": { tr: "canlı yayın", en: "live broadcast" },
  "radyo.canliRadyo": { tr: "canlı radyo", en: "live radio" },
  "radyo.benzer": { tr: "benzer istasyonlar", en: "similar stations" },
  "radyo.canli": { tr: "canlı", en: "live" },
  "radyo.resmiSite": { tr: "Resmî site:", en: "Official site:" },
  // oynatıcı
  "player.dinle": { tr: "▶ Canlı Dinle", en: "▶ Listen Live" },
  "player.durdur": { tr: "❚❚ Durdur", en: "❚❚ Stop" },
  "player.baglaniyor": { tr: "bağlanıyor…", en: "connecting…" },
  "player.ulasilamadi": { tr: "yayına ulaşılamadı", en: "stream unavailable" },
  "player.paylas": { tr: "paylaş", en: "share" },
  "player.kopyalandi": { tr: "kopyalandı ✓", en: "copied ✓" },
  "player.kart": { tr: "kart", en: "card" },
  // kalp defteri
  "defter.baslik": { tr: "kalp defteri", en: "guestbook" },
  "defter.yer": { tr: "bir anı bırak… (140 karakter)", en: "leave a note… (140 chars)" },
  "defter.birak": { tr: "bırak", en: "post" },
  "defter.hata": { tr: "Gönderilemedi — link olmasın, 2–140 karakter olsun.", en: "Couldn't post — no links, 2–140 chars." },
  "defter.ilk": { tr: "ilk anıyı sen bırak.", en: "be the first to leave a note." },
  // ortak
  "ortak.kalpGonder": { tr: "bu istasyona kalp gönder", en: "send this station a heart" },
};

export function ceviri(dil: Dil, anahtar: string): string {
  const e = SOZLUK[anahtar];
  if (!e) return anahtar;
  return dil === "en" ? e.en : e.tr;
}

// İstasyon türü → görünen ad (dile göre). Veri Türkçe; yalnızca etiket çevrilir.
const TUR_ADI: Record<string, string> = {
  arabesk: "arabesque",
  caz: "jazz",
  türkü: "folk",
  nostalji: "nostalgia",
  rock: "rock",
  klasik: "classical",
  elektronik: "electronic",
  "türkçe pop": "turkish pop",
  pop: "pop",
  alternatif: "alternative",
  tsm: "art music",
  metal: "metal",
};

export function turAdi(dil: Dil, tur: string | null | undefined): string {
  if (!tur) return "";
  return dil === "en" ? TUR_ADI[tur] || tur : tur;
}
