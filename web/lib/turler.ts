// Tür merkez sayfaları — /tur/[slug]. SEO'nun kalbi: "caz radyosu",
// "rock radyo dinle" gibi yüksek hacimli aramaları yakalar. Her tür için
// ÖZGÜN, yararlı bir tanıtım metni (Google özgün içerik ister).

export type TurBilgi = {
  slug: string; // URL: /tur/<slug>
  genre: string; // veritabanındaki tür değeri
  baslik: string; // sayfa başlığı (H1)
  ozet: string; // meta açıklama / giriş
  govde: string; // sayfa metni (özgün, tek paragraf)
};

export const TURLER: TurBilgi[] = [
  {
    slug: "caz",
    genre: "caz",
    baslik: "Caz Radyoları",
    ozet: "Canlı caz radyoları — gece yarısına, kadehin dibine yakışan sesler. Şu an hangi caz istasyonunda ne çalıyor, tek ekranda.",
    govde:
      "Caz, planlanmayan müziğin adıdır; her solo bir kez çalınır ve bir daha asla aynı olmaz. Bu yüzden caz ile radyo iyi anlaşır — ikisi de canlıdır, ikisi de 'şimdi'ye aittir. Aşağıdaki istasyonlarda şu an ne çaldığını görebilir, bir dokunuşla dinlemeye başlayabilirsin.",
  },
  {
    slug: "rock",
    genre: "rock",
    baslik: "Rock Radyoları",
    ozet: "Canlı rock radyoları — gitarlar sonuna kadar açık. Şu an hangi rock istasyonunda ne çalıyor, canlı.",
    govde:
      "Ses açıldıkça duvarlar geriler. Rock, bir tavırdır kadar bir tür değildir; ve radyoda çaldığında o tavrı bütün şehre yayar. Türk ve dünya rock istasyonlarında şu an çalanı gör, sevdiğini seç, dinle.",
  },
  {
    slug: "klasik",
    genre: "klasik",
    baslik: "Klasik Müzik Radyoları",
    ozet: "Canlı klasik müzik radyoları — yaylılar, piyano, sonsuzluk. Şu an hangi klasik istasyonunda ne çalıyor.",
    govde:
      "Klasik müzik, aceleye gelmeyen bir dinleme ister; radyo da onu sabırla akıtır. Çalışırken, okurken ya da sadece durmak için — klasik istasyonlarında şu an ne çaldığını buradan görebilirsin.",
  },
  {
    slug: "elektronik",
    genre: "elektronik",
    baslik: "Elektronik Müzik Radyoları",
    ozet: "Canlı elektronik radyolar — şafağa kadar süren bir set. Şu an hangi istasyonda ne çalıyor.",
    govde:
      "Bir bas, bir tekrar, bir nefes. Elektronik müzik akışta yaşar; radyo da bir akıştır. House'tan ambient'e, dünyanın dört bir yanından elektronik istasyonlarında şu an çalanı keşfet.",
  },
  {
    slug: "arabesk",
    genre: "arabesk",
    baslik: "Arabesk Radyoları",
    ozet: "Canlı arabesk radyoları — bir sigara, bir dert, bir şarkı. Şu an hangi arabesk istasyonunda ne çalıyor.",
    govde:
      "Arabesk, şehrin gecesinde en çok konuşulan dildir; kalbe dokunan sözler, uzayan nakaratlar. Arabesk istasyonlarında şu an ne çaldığını gör, o sese kendini bırak.",
  },
  {
    slug: "nostalji",
    genre: "nostalji",
    baslik: "Nostalji / Slow Radyoları",
    ozet: "Canlı nostalji ve slow radyoları — eski bir kaset, geri sarılan bir yaz. Şu an ne çalıyor.",
    govde:
      "Bazı şarkılar seni bir yıl değil, bir yaz geri götürür. Nostalji istasyonları o yazları saklar. Şu an hangi eski parçanın çaldığını gör, hatırla.",
  },
  {
    slug: "alternatif",
    genre: "alternatif",
    baslik: "Alternatif / Indie Radyoları",
    ozet: "Canlı alternatif ve indie radyoları — listelerin dışında, kendi frekansında. Şu an ne çalıyor.",
    govde:
      "En iyi şarkı bazen henüz kimsenin bilmediğidir. Alternatif ve indie istasyonları tam da bunun için var. KEXP'ten yerel indie radyolara, şu an çalanı keşfet.",
  },
  {
    slug: "pop",
    genre: "pop",
    baslik: "Pop Radyoları",
    ozet: "Canlı pop radyoları — radyonun en parlak yüzü. Şu an hangi pop istasyonunda ne çalıyor.",
    govde:
      "Pop, herkesin bildiği nakarattır; camlar açık, yol uzun. Türk ve dünya pop istasyonlarında şu an çalanı gör, mırıldanmaya başla.",
  },
  {
    slug: "turkce-pop",
    genre: "türkçe pop",
    baslik: "Türkçe Pop Radyoları",
    ozet: "Canlı Türkçe pop radyoları — hepimizin şarkısı. Şu an hangi istasyonda ne çalıyor.",
    govde:
      "Türkçe pop, bir kuşağın ortak hafızasıdır. Şu an hangi istasyonda hangi parçanın çaldığını gör, sevdiğini bul.",
  },
  {
    slug: "turku",
    genre: "türkü",
    baslik: "Türkü Radyoları",
    ozet: "Canlı türkü radyoları — toprak konuşur, bağlama tercüme eder. Şu an ne çalıyor.",
    govde:
      "Türkü, en eski ve en yerli sestir; bir bağlama, bir uzun hava. Türkü istasyonlarında şu an çalanı buradan takip edebilirsin.",
  },
  {
    slug: "tsm",
    genre: "tsm",
    baslik: "Türk Sanat Müziği Radyoları",
    ozet: "Canlı Türk sanat müziği radyoları — makamlar ve incelik. Şu an ne çalıyor.",
    govde:
      "Türk sanat müziği, incelen ama kırılmayan bir zarafettir. Makamların şu an hangi istasyonda çaldığını gör, kulağını o inceliğe ver.",
  },
  {
    slug: "metal",
    genre: "metal",
    baslik: "Metal Radyoları",
    ozet: "Canlı metal radyoları — gürültü değil, öfkenin müziği. Şu an ne çalıyor.",
    govde:
      "Metal, duvarları titreten bir dürüstlüktür. Metal istasyonlarında şu an ne çaldığını gör, sesi sonuna kadar aç.",
  },
];

export function turBul(slug: string): TurBilgi | undefined {
  return TURLER.find((x) => x.slug === slug);
}

// Veritabanı tür değerinden URL slug'ı (ör. "türkçe pop" → "turkce-pop").
export function turSlug(genre: string | null | undefined): string | null {
  if (!genre) return null;
  return TURLER.find((x) => x.genre === genre)?.slug ?? null;
}
