// ───────────────────────────────────────────────────────────────
//  ŞİMDİ — şiir defteri
//  Sitenin bütün edebi sesi burada. Bu dizeler taslaktır; KENDİ
//  kalemininkilerle değiştir. Bir yerini değiştirdiğinde site
//  boyunca o ses değişir.
// ───────────────────────────────────────────────────────────────

// Günün saatine göre şiirsel karşılama.
export function selamla(h: number): string {
  if (h < 6) return "gecenin en sessiz saatinde, bir yerde hâlâ müzik var";
  if (h < 11) return "sabah oldu; sesler de bizimle uyanıyor";
  if (h < 18) return "gün ortası; frekanslar akıp gidiyor";
  if (h < 22) return "akşam düştü, şimdi dinleme vakti";
  return "gece bizim: kısık bir ses, uzun bir düş";
}

// Boş ekranda dönen "günün epigrafı".
export const EPIGRAFLAR = [
  "Her şarkı, çalarken bir 'şimdi'dir.",
  "Kelimeler sustuğunda, frekanslar konuşur.",
  "Bir radyo, uzaktaki bir kalbin sesidir.",
  "Ne çalıyorsa, o an sana çalıyor.",
  "Sesler geçer; ama 'şimdi' arşivde kalır.",
  "Dinlemek de bir yazma biçimidir.",
];

// Yükleniyorken.
export const YUKLENIYOR = ["sesler toplanıyor…", "frekanslar aranıyor…", "iğne plağa iniyor…"];

// 404 — olmayan sayfa.
export const YOK = {
  baslik: "bu frekans boş",
  alt: "ama müzik hep bir yerde çalıyor. gel, geri dönelim.",
};

// Türe girince üstte beliren epigraf.
export const TUR_EPIGRAF: Record<string, string> = {
  arabesk: "bir sigara, bir dert, bir de bu şehir…",
  caz: "gece yarısı, kadehin dibinde bir saksofon.",
  türkü: "toprak konuşur, bağlama tercüme eder.",
  nostalji: "eski bir kaset, geri sarılan bir yaz.",
  rock: "ses açıldıkça duvarlar geriler.",
  klasik: "yaylılar: sonsuzluğu deneyen parmaklar.",
  elektronik: "şafağa kadar süren tek bir nefes.",
  "türkçe pop": "camlar açık, yol uzun, nakarat hazır.",
  pop: "radyonun en parlak, en hafif yüzü.",
  alternatif: "listelerin dışında, kendi frekansında.",
  tsm: "makamlar: incelen ama kırılmayan.",
  metal: "gürültü değil — öfkenin müziği.",
};

// Uzun sessizlikte beliren fısıltı.
export const FISILTI = "hâlâ buradayım. dinliyor musun?";

// İlk giriş selamı (bir kez görünür).
export const HOSGELDIN = {
  baslik: "hoş geldin",
  satir: "seslerin arasına. bir istasyona dokun, 'şimdi' başlasın.",
};

// Favoriye eklenince beliren onay.
export const FAVORI_ONAY = "bu ses artık senin.";

// Bugünün dizesi (güne göre döner).
export const DIZELER = [
  "Şimdi: iki nota arasındaki o kısa sonsuzluk.",
  "Bir frekans tut, gerisini akışa bırak.",
  "Sesin geçtiği yerde bir iz kalır.",
  "En güzel şarkı, farkında olmadan mırıldandığındır.",
  "Radyo, yalnızlığa eşlik eden en eski dosttur.",
];

// ── Şairin Frekansı ──
// Yazarken açık bıraktıklarım. Klasik, akustik, biraz da gürültü.
// Buradaki slug'ları dilediğin gibi değiştir — bunlar senin seçkin.
export const SAIRIN = {
  baslik: "Şairin Frekansı",
  alt: "yazarken açık bıraktıklarım — klasik, akustik, biraz da gürültü.",
  slugs: [
    "borusan-klasik",
    "itu-klasik",
    "radio-swiss-classic",
    "radyo-eksen",
    "joyturk-rock",
    "radyo-odtu-rock",
    "turk-rock-fm",
    "max-fm",
    "apacik-radyo",
    "kexp",
    "radio-paradise-rock",
  ] as string[],
};

// Deterministik günlük seçim (SSR güvenli — rastgelelik yok).
export function gununDizesi(): string {
  const d = new Date();
  const gun = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  return DIZELER[gun % DIZELER.length];
}
