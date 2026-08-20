// ───────────────────────────────────────────────────────────────
//  ŞİMDİ — Deneme Köşesi
//  Sitenin nesir sesi. Bu denemeler taslaktır; KENDİ kalemininkilerle
//  değiştir ya da yenilerini ekle. Bir deneme eklemek için diziye yeni
//  bir nesne koyman yeter — köşe ve okuma sayfası kendiliğinden oluşur.
// ───────────────────────────────────────────────────────────────

export type Deneme = {
  slug: string;
  baslik: string;
  tarih: string; // "2026-08-20"
  ozet: string; // liste ve paylaşım için tek cümle
  epigraf?: string; // yazının başındaki dize
  govde: string[]; // paragraflar
};

export const DENEMELER: Deneme[] = [
  {
    slug: "radyonun-kalan-yeri",
    baslik: "Radyonun Kalan Yeri",
    tarih: "2026-08-20",
    ozet: "Her şey isteğe göre akarken, kimsenin seçmediği bir sesin hâlâ bir değeri var mı?",
    epigraf: "Ne çalıyorsa, o an sana çalıyor.",
    govde: [
      "Bir düğmeye basıp istediğim şarkıyı istediğim an dinleyebildiğim bir çağda, radyonun ne işe yaradığını çok soruyorum kendime. Cevabı hep aynı yerden geliyor: radyo bana seçmediğim şeyi getiriyor. Beklemediğim bir şarkı, unuttuğum bir ses, tanımadığım bir dil. Seçim özgürlüğü bir yandan da bir hapishane; hep bildiğimin içinde dönüyoruz. Radyo o duvarı deliyor.",
      "Bir de şu var: radyoda çalan şarkı, benimle birlikte başka birine de çalıyor. Uzak bir şehirde, tanımadığım biri, tam şu an aynı nakaratı duyuyor. Bu eşzamanlılık, kişisel çalma listemin veremeyeceği bir şey. Yalnızlığın panzehiri bazen bir algoritma değil, aynı frekansı paylaşmaktır.",
      "Bu yüzden bu siteyi yaptım. Ne çalıyor diye bakmak için değil sadece; birinin, bir yerde, tam şimdi, benimle aynı sesi duyduğunu bilmek için.",
    ],
  },
  {
    slug: "iki-nota-arasi",
    baslik: "İki Nota Arası",
    tarih: "2026-08-19",
    ozet: "Müziği müzik yapan, seslerin kendisi değil, aralarındaki o kısa sessizlik.",
    epigraf: "Şimdi: iki nota arasındaki o kısa sonsuzluk.",
    govde: [
      "Bir şarkıyı hatırladığımızda aslında notaları değil, aralarındaki boşlukları hatırlarız. Ritim dediğimiz şey sesin değil, sessizliğin ölçüsüdür. En güzel nakarat, bir an duraklayıp sonra patlayandır.",
      "'Şimdi' de öyle bir şey. Geçmişle gelecek arasındaki o ince çizgi; tutulamayan ama her şeyin içinde olduğu an. Bir radyo bize sürekli 'şimdi'yi verir — kaydedilmiş değil, akan. Bittiğinde geri alınamaz. Belki de bu yüzden canlı yayının kendine has bir gerilimi var: bir daha asla tam olarak aynı olmayacak.",
    ],
  },
  {
    slug: "frekansin-sehri",
    baslik: "Frekansın Şehri",
    tarih: "2026-08-18",
    ozet: "Her radyo bir şehirdir; kendi caddeleri, kendi geceleri, kendi kalabalığı vardır.",
    epigraf: "Bir radyo, uzaktaki bir kalbin sesidir.",
    govde: [
      "Bir istasyonu uzun dinlersen, onun bir karakteri olduğunu fark edersin. Biri hep akşamüstü hüznüne çalar, biri sabahın telaşına. Biri kalabalık bir meydandır, biri tenha bir sahil. Radyolar müzik çalmaz sadece; bir ruh hâli kurar ve seni oraya davet eder.",
      "Bu sitede istasyonları renklerle ayırdım — her birinin kendi tonu var. Çünkü bir frekans bir yerdir, ve her yerin bir rengi olmalı.",
    ],
  },
];

// Güne göre öne çıkan deneme (SSR güvenli — deterministik).
export function gununDenemesi(): Deneme {
  const d = new Date();
  const gun = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  return DENEMELER[gun % DENEMELER.length];
}

export function denemeBul(slug: string): Deneme | undefined {
  return DENEMELER.find((x) => x.slug === slug);
}
