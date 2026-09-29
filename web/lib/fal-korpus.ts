/* FAL KORPUSU — berkaydogan-co/lib/sozler.ts'in KOPYASI (kaynak tek, orası).
   KURAL: uydurma dize asla; değişiklik önce kaynakta yapılır, buraya kopyalanır. */
export type Soz = {
  s: string;
  k: "mvk" | "tas";
  p?: number;
  t: string[];
};

export const SOZLER: Soz[] = [
  // ---------- MÜREKKEP VE KÖZ ----------
  { s: "Yıkılamadım, yıktım.", k: "mvk", t: ["yikim", "ozgurluk"] },
  { s: "Geri dönmüyorum, geleceğime âşığım.", k: "mvk", t: ["umut", "zaman"] },
  { s: "Yalan yaşanmışlıklarıma veda ettim.", k: "mvk", t: ["yuzlesme", "yikim"] },
  { s: "Kalbim bir gıdım bile kırılmadan devam etti.", k: "mvk", p: 77, t: ["umut", "hayat"] },
  { s: "Yeniden kendi içime dönüyorum.", k: "mvk", t: ["yalnizlik", "kimlik"] },
  { s: "Ben artık sadece kendimim.", k: "mvk", p: 183, t: ["kimlik", "ozgurluk"] },
  { s: "Ve ben yeniden doğdum; şimdi sıra sende.", k: "mvk", t: ["yikim", "umut"] },
  { s: "Acı bir yük değil; gerçeğe açılan bir kapı vardır.", k: "mvk", t: ["yuzlesme", "hayat"] },
  { s: "Küllerinden yeniden doğmayı seçmiş bir ruhun sesidir.", k: "mvk", t: ["yikim", "umut"] },
  { s: "Ben bir Tanrı değilim.", k: "mvk", t: ["kimlik", "yuzlesme"] },
  { s: "Renginizi kaçırmayın.", k: "mvk", t: ["hayat", "umut"] },
  { s: "Sözler hem bir isyanın hem de bir teslimiyetin izlerini taşır.", k: "mvk", t: ["sanat", "yuzlesme"] },
  { s: "Yazmak, varoluşun en sessiz itirafıdır.", k: "mvk", t: ["sanat", "kimlik"] },
  { s: "Oyunun içinde, sistemin atamadığı bir yerdeyim.", k: "mvk", p: 17, t: ["ozgurluk", "kimlik"] },
  { s: "İnsanların içinde yalnızlaşan olarak kalıyorum.", k: "mvk", p: 20, t: ["yalnizlik"] },
  { s: "Kaçanlar mutlu olmuyor, merak etmeyin.", k: "mvk", p: 24, t: ["hayat", "yuzlesme"] },
  { s: "Acın beni yetiştirir, içimde yeşerirsin.", k: "mvk", p: 26, t: ["ask", "yikim"] },
  { s: "Mutsuzluktan ölmezsin, korkma!", k: "mvk", p: 26, t: ["umut", "hayat"] },
  { s: "Bir umut daha gökyüzünden kaydı, olmayacakların içine.", k: "mvk", p: 28, t: ["umut", "karanlik"] },
  { s: "Pişmanlıklar kalıcıdır, tecrübeler gibi.", k: "mvk", p: 28, t: ["zaman", "hayat"] },
  { s: "Parça parça eksiliyorum, yavaş yavaş eskiyorum.", k: "mvk", p: 29, t: ["zaman", "yikim"] },
  { s: "Hayatın sillesini yemiş olmama rağmen umudumu yitirmedim.", k: "mvk", p: 32, t: ["umut", "hayat"] },
  { s: "Acıya katlanmak, simsiyah bir yüreğe bakmak gibidir.", k: "mvk", p: 33, t: ["karanlik", "yuzlesme"] },
  { s: "Arafta, bilinmeyen bir viraneyim.", k: "mvk", p: 33, t: ["yalnizlik", "kimlik"] },
  { s: "Zamansız büyümek nedir biliyor musun?", k: "mvk", p: 34, t: ["zaman", "hayat"] },
  { s: "Denizin kıyısında, hayatın başında.", k: "mvk", p: 37, t: ["umut", "hayat"] },
  { s: "Benim hikâyem yeni başladı.", k: "mvk", p: 38, t: ["umut", "kimlik"] },
  { s: "Huzur, sakın kapımı çalma.", k: "mvk", p: 39, t: ["yikim", "hayat"] },
  { s: "Yerçekimi değil, aşk tutuyor.", k: "mvk", p: 40, t: ["ask"] },
  { s: "Her şeyi bir bir ucundan yakalıyorum, bırakmıyorum.", k: "mvk", p: 44, t: ["hayat", "umut"] },
  { s: "Elimde bir müziğim, bir de bisikletim kaldı.", k: "mvk", p: 48, t: ["yalnizlik", "hayat"] },
  { s: "Kim olduğumu ararken, kendimi kaybettim.", k: "mvk", p: 48, t: ["kimlik", "yalnizlik"] },
  { s: "Bembeyaz bir gelecekte, rengarenk kalbimle büyüyordum.", k: "mvk", p: 49, t: ["umut", "zaman"] },
  { s: "Korkup kaçan mürekkep balığının aksine, durup yüzleşiyorum.", k: "mvk", p: 50, t: ["yuzlesme", "sanat"] },
  { s: "İmkansızı ararken, aramaktan yoruldum.", k: "mvk", p: 50, t: ["umut", "hayat"] },
  { s: "Küçücük bir adamdım kendi içimde, büyüdüm ve yalnız kaldım.", k: "mvk", p: 51, t: ["yalnizlik", "zaman"] },
  { s: "Sen bilir misin deli doğmak nedir?", k: "mvk", p: 51, t: ["kimlik", "hayat"] },
  { s: "Aşksızlıklar kalbime hançer oldu.", k: "mvk", p: 57, t: ["ask", "karanlik"] },
  { s: "Umutsuzluklar kapıma yumruklarla vurdu.", k: "mvk", p: 57, t: ["umut", "karanlik"] },
  { s: "Yaşam tarzım beni yaşatır.", k: "mvk", p: 60, t: ["kimlik", "hayat"] },
  { s: "Ben tükendiğimde dünya yansın.", k: "mvk", p: 61, t: ["yikim", "kimlik"] },
  { s: "Sen belki de gökyüzünde hiç açmayan gökkuşağısın.", k: "mvk", p: 65, t: ["ask", "umut"] },
  { s: "Aşksız ama umut dolu bir hayatta yaşıyorum.", k: "mvk", p: 69, t: ["umut", "ask"] },
  { s: "Belki de geç değildir dersin ve sarılırsın hayata.", k: "mvk", p: 73, t: ["umut", "hayat"] },
  { s: "Bizi düşünmeyenleri umursamamak hayattı belki de.", k: "mvk", p: 78, t: ["hayat", "ozgurluk"] },
  { s: "Ben geleceklerinden emin olmayan nesildenim.", k: "mvk", p: 79, t: ["zaman", "hayat"] },
  { s: "Hayatı enstrüman notalarına sığdırır mısın?", k: "mvk", p: 80, t: ["sanat", "hayat"] },
  { s: "Sensiz yıllarda, sensiz sokaklarda, yalnız şarkılarda.", k: "mvk", p: 83, t: ["ask", "yalnizlik", "sehir"] },
  { s: "Hayatın anlamı belki de sanatsal bir tabloda eksik olan anahtardır.", k: "mvk", p: 85, t: ["sanat", "hayat"] },
  { s: "Ben içimdeki çocukları öldürdüm.", k: "mvk", p: 89, t: ["yikim", "zaman"] },
  { s: "Ben senden sonra değil, kimseden sonra ölmedim.", k: "mvk", p: 90, t: ["ask", "ozgurluk"] },
  { s: "Benim tutkum akla, fikre.", k: "mvk", p: 90, t: ["sanat", "kimlik"] },
  { s: "Hayat kırıntıları can oldu kırık kalbime.", k: "mvk", p: 90, t: ["hayat", "umut"] },
  { s: "Hayatı bir espresso misali tükettim.", k: "mvk", p: 93, t: ["hayat", "zaman"] },
  { s: "Benim ölmek için zamanım yok.", k: "mvk", p: 95, t: ["hayat", "umut"] },
  { s: "Beni benimle bıraktın giderken ve hâlâ öyleyim!", k: "mvk", p: 97, t: ["yalnizlik", "kimlik"] },
  { s: "Beni biraz kendine yakın tut Dünya.", k: "mvk", p: 102, t: ["hayat", "yalnizlik"] },
  { s: "İnsansızlıklarınız ağır geldi Dünya'ya!", k: "mvk", p: 102, t: ["yuzlesme", "karanlik"] },
  { s: "Bu sonsuz karmaşa düzeninde özgür değiliz ki.", k: "mvk", p: 106, t: ["ozgurluk", "yuzlesme"] },
  { s: "Hayatı o kadar az yaşıyoruz ki.", k: "mvk", p: 106, t: ["hayat", "zaman"] },
  { s: "Şehirler harabe, dünya bir kabare tiyatrosu misali.", k: "mvk", p: 106, t: ["sehir", "yikim"] },
  { s: "Biraz daha yolum var, yorulmam asla şimdi değil.", k: "mvk", p: 110, t: ["umut", "hayat"] },
  { s: "Özgürlüklerimle yanarsam yakışır bana.", k: "mvk", p: 112, t: ["ozgurluk", "yikim"] },
  { s: "Hayata balyozla değil sevişlerle vurmayı seviyorum.", k: "mvk", p: 113, t: ["hayat", "ask"] },
  { s: "Ben yine seni seçtim İstanbul.", k: "mvk", p: 115, t: ["sehir", "ask"] },
  { s: "Biz iki kral, makus talihi yendik bugün.", k: "mvk", p: 119, t: ["ask", "umut"] },
  { s: "Hayatın alt dudağını öpüyorum.", k: "mvk", p: 121, t: ["hayat", "ask"] },
  { s: "İnsanlar bazen sahteliklerini aynalarda göremiyor da.", k: "mvk", p: 121, t: ["yuzlesme", "kimlik"] },
  { s: "Sen büyük bir şehirsin.", k: "mvk", p: 134, t: ["sehir", "ask"] },
  { s: "Ben unutamadım, sen unuttun mu?", k: "mvk", p: 135, t: ["ask", "zaman"] },
  { s: "Kalbimiz taşlaştı, vicdanımız yozlaştı.", k: "mvk", p: 139, t: ["yuzlesme", "karanlik"] },
  { s: "Aşk bir mevsimdi ve ben onu kaçırdım.", k: "mvk", p: 141, t: ["ask", "zaman"] },
  { s: "Ben senden gidiyordum usulca.", k: "mvk", p: 148, t: ["ask", "yalnizlik"] },
  { s: "Biz halının altına süpürdüklerimize endişeyle bakıyoruz.", k: "mvk", p: 150, t: ["yuzlesme"] },
  { s: "Kalbim solmuş da olsa açılıyorum okyanusa doğru.", k: "mvk", p: 153, t: ["umut", "hayat"] },
  { s: "İnsanların kalbine dokunurken, kalpsiz birine dönüşüyorum.", k: "mvk", p: 153, t: ["yalnizlik", "yuzlesme"] },
  { s: "Çaba, hak edenlere verilen çok nadide bir hobidir.", k: "mvk", p: 154, t: ["hayat"] },
  { s: "Derinlere karışıp, tarumar değil, anka kuşu olacağım.", k: "mvk", p: 158, t: ["yikim", "umut"] },
  { s: "İnsanlığı seçtim, saçmalıkları değil.", k: "mvk", p: 158, t: ["kimlik", "yuzlesme"] },
  { s: "Ben özgürlüğümün ta kendisiyim!", k: "mvk", p: 182, t: ["ozgurluk", "kimlik"] },

  // ---------- TASFİYE ----------
  { s: "Gerçek, yağlarından arındığında ortaya çıkan kemiktir.", k: "tas", t: ["yuzlesme"] },
  { s: "Görmezden gelmeyi seçtiğimiz her şeye verilmiş bir isim.", k: "tas", t: ["yuzlesme"] },
  { s: "Bize ezilenlerin değil, ezenlerin tarafına geçme umudu satıldı.", k: "tas", p: 15, t: ["umut", "yuzlesme"] },
  { s: "Kendi karanlığını bilmeyen insan, aydınlık uğruna dünyayı ateşe vermekten çekinmez.", k: "tas", p: 79, t: ["karanlik", "yuzlesme"] },
  { s: "Yaşamak, biraz da geride posa bırakmaktır.", k: "tas", p: 89, t: ["hayat", "zaman"] },
  { s: "Biz şehri terk ettiğimizde, anılarımız o şehrin taşlarına, duvarlarına emanet edilir.", k: "tas", p: 100, t: ["sehir", "zaman"] },
  { s: "Tasfiye, yıkmak değil; temizlemektir.", k: "tas", t: ["yikim", "yuzlesme"] },
  { s: "Suyun altında olduğumuzu fark etmek, yüzeye doğru atılacak ilk ve en hayati kulaçtır.", k: "tas", p: 12, t: ["yuzlesme", "umut"] },
  { s: "İnsan, kendi hayatını taksitle satın alan tek canlıdır.", k: "tas", p: 14, t: ["hayat", "yuzlesme"] },
  { s: "Boş teneke, kendi boşluğunu duymamak için sürekli başka tenekelere çarpmak zorundadır.", k: "tas", p: 17, t: ["yalnizlik", "yuzlesme"] },
  { s: "Kendileriyle baş başa kalmak, çağımızın en büyük fobisi haline gelmiştir.", k: "tas", p: 17, t: ["yalnizlik"] },
  { s: "Köleliğe alışmış bir zihin için en büyük düşman, onu serbest bırakmak isteyen kişidir.", k: "tas", p: 21, t: ["ozgurluk", "yuzlesme"] },
  { s: "Düşünmek, zihnin kendisine karşı bir devrim yapmasıdır.", k: "tas", p: 25, t: ["ozgurluk", "sanat"] },
  { s: "İnsan, ancak kendi cehaletinin sınırlarını bir fenerle aydınlatmaya başladığında hakiki anlamda var olabilir.", k: "tas", p: 25, t: ["yuzlesme", "karanlik"] },
  { s: "Konfor alanının en tehlikeli yanı, onun bir ceza gibi değil, bir ödül gibi sunulmasıdır.", k: "tas", p: 40, t: ["ozgurluk", "hayat"] },
  { s: "Prangalarımız demirden değil, kadifeden yapılmıştır.", k: "tas", p: 40, t: ["ozgurluk"] },
  { s: "Cesaret, korkunun yokluğu değil, korkuya rağmen adım atabilme iradesidir.", k: "tas", p: 41, t: ["umut", "ozgurluk"] },
  { s: "Hiçbir şey hissetmemek, her şeyin hissettirildiği bir dünyada verilebilecek en pasif ama en yaygın tepkidir.", k: "tas", p: 58, t: ["karanlik", "yuzlesme"] },
  { s: "İtaat etmenin bedeli, kendi ruhunun ritmine yabancılaşmaktır.", k: "tas", p: 59, t: ["ozgurluk", "kimlik"] },
  { s: "Kötülüğün bir yerlerden üzerimize çöktüğüne inanmak safdilliktir; kötülük ekilir, filizlenir ve büyür.", k: "tas", p: 77, t: ["karanlik", "yuzlesme"] },
  { s: "Mesele bu gölgeyi yok etmek değil, onun bize ait olduğunu kabul etmektir.", k: "tas", p: 79, t: ["karanlik", "kimlik"] },
  { s: "İnsan olmak, ışığı kesmek ve bir gölge düşürmek demektir.", k: "tas", p: 79, t: ["karanlik", "kimlik"] },
  { s: "Dünya kaotiktir, rastlantısaldır ve çoğu zaman adaletsizdir.", k: "tas", p: 80, t: ["hayat", "yuzlesme"] },
  { s: "Bize hakikati değil, huzuru satarlar; gerçeği değil, kesinliğin uyuşturucu etkisini vaat ederler.", k: "tas", p: 81, t: ["yuzlesme"] },
  { s: "Dil, düşüncenin hem evi hem de en hassas terazisidir.", k: "tas", p: 82, t: ["sanat"] },
  { s: "Hayat, formüllere indirgenemeyecek kadar zengin ve trajiktir.", k: "tas", p: 83, t: ["hayat"] },
  { s: "Statü, yalnızca ona inanan başkalarının bakışlarında var olabilen bir seraptır.", k: "tas", p: 85, t: ["kimlik", "yuzlesme"] },
  { s: "Bizler, durmadan arzulayan ve arzusu çabuk tükenen varlıklarız.", k: "tas", p: 88, t: ["hayat", "zaman"] },
  { s: "Unutmak ve atmak, varoluşun devamlılığı için elzem birer budama işlemidir.", k: "tas", p: 89, t: ["zaman", "yikim"] },
  { s: "Bizler, aklımız başımızda olduğu için acı çekeriz.", k: "tas", p: 91, t: ["yuzlesme", "hayat"] },
  { s: "Gerçeğin keskin kenarları insanın ruhunu kanatır.", k: "tas", p: 95, t: ["yuzlesme", "karanlik"] },
  { s: "Özgürlük, cehaletin o sahte lütfuna sığınmadan, gerçeğin ağırlığını taşıyarak ayakta kalabilme iradesidir.", k: "tas", p: 96, t: ["ozgurluk", "yuzlesme"] },
  { s: "Her sokak lambasının altında yaşanmış bir ânı, her köşe başında yarım kalmış bir konuşma gizlidir.", k: "tas", p: 100, t: ["sehir", "zaman"] },
  { s: "Valize sığmayan her nesne, aslında geride bıraktığımız hayatın bir parçasıdır.", k: "tas", p: 100, t: ["sehir", "zaman"] },
  { s: "Geriye bakmamak, bir inkâr değil, ileriye doğru atılan adımın hakkını vermektir.", k: "tas", p: 101, t: ["zaman", "umut"] },
  { s: "Manifestomuz, bir yere varmayı değil, yolda olmayı yüceltir.", k: "tas", p: 102, t: ["ozgurluk", "hayat"] },
  { s: "Affetmek bir tür uzlaşmaysa, unutmak mutlak bir hükümsüz kılmadır.", k: "tas", p: 109, t: ["zaman", "yuzlesme"] },
  { s: "Benim yalnızlığım, onların o gürültülü ve içi boş kalabalıklarından çok daha sahici bir şifadır.", k: "tas", p: 115, t: ["yalnizlik"] },
  { s: "Affetmek, statükoyu korur; unutmak ise yeniye kapı açar.", k: "tas", p: 124, t: ["zaman", "yikim"] },
  { s: "Geçmişin hayaletleri, affedilmeyi beklemezler; onlar sadece unutulmayı talep ederler.", k: "tas", p: 124, t: ["zaman", "karanlik"] },
  { s: "Kimlik, başkalarının bize biçtiği değil, bizim her an yeniden yazmaya cesaret edebildiğimiz bir metindir.", k: "tas", p: 128, t: ["kimlik", "ozgurluk"] },
  { s: "Belki de kimlik, bir cevap değil, sürekli bir sorudur.", k: "tas", p: 129, t: ["kimlik"] },
  { s: "İnsan, kendi boşluğunda kaybolduğunda değil, o boşluğu kendi hakikatiyle doldurduğunda özgürleşir.", k: "tas", p: 129, t: ["ozgurluk", "kimlik"] },
  { s: "Belki de bizi biz yapan, sahip olduklarımız değil, sahip olmadıklarımızdır.", k: "tas", p: 130, t: ["kimlik", "hayat"] },
  { s: "Nereye gittiğiniz değil, nasıl yürüdüğünüz önemlidir.", k: "tas", p: 130, t: ["hayat", "ozgurluk"] },
  { s: "Maskeyi giymek bir zorunluluksa, onu çıkarmak bir haktır.", k: "tas", p: 131, t: ["kimlik", "ozgurluk"] },
  { s: "Belki de gerçek özgürlük, oyunu oynamayı reddetmek değil, oyunu kendi kurallarınla oynamaktır.", k: "tas", p: 132, t: ["ozgurluk"] },
  { s: "Artık biliyorum ki kimlik bir maske değil, bir ayna.", k: "tas", p: 133, t: ["kimlik", "yuzlesme"] },
  { s: "Kaçış dediğiniz şey, artık dış dünyadan bir yere gitmek değil, kendi zihninizin merkezine bir krallık kurmaktır.", k: "tas", p: 140, t: ["ozgurluk", "kimlik"] },
  { s: "Bu boşluk, korkulacak bir uçurum değil, üzerinde yeni bir dünya kurulabilecek tek temiz zemindir.", k: "tas", p: 143, t: ["umut", "yikim"] },
  { s: "Gidiş, bir kaçış değil, bir manifestodur; bir varoluş tarzının reddi ve bir başkasının arayışıdır.", k: "tas", p: 143, t: ["ozgurluk", "sehir"] },
  { s: "İnsan, kendi boşluğuyla baş başa kaldığında, artık bir oyuncu değil, bir yaratıcı olmaya başlar.", k: "tas", p: 143, t: ["sanat", "yalnizlik"] },
  { s: "Her nefes, bir başlangıç; her adım, yeni bir ufka yelken açmaktır.", k: "tas", p: 144, t: ["umut", "hayat"] },
  { s: "Zamanı kuran insan, artık zamanın kölesi değil, efendisidir.", k: "tas", p: 144, t: ["zaman", "ozgurluk"] },
  { s: "İnsan, her an yeniden başlayabilme kapasitesine sahiptir.", k: "tas", p: 144, t: ["umut", "zaman"] },
  { s: "Sahne boştur, perde açılmıştır ve seyirciler gitmiştir.", k: "tas", p: 145, t: ["yikim", "ozgurluk"] },
  { s: "İnsanın kendi kendine karşı dürüst olması, belki de dünyadaki en zor ama en değerli eylemdir.", k: "tas", p: 146, t: ["yuzlesme", "kimlik"] },
  { s: "Kimliğimiz, bir tablo gibi sabit değil, bir nehir gibi akışkandır.", k: "tas", p: 147, t: ["kimlik", "zaman"] },

  // ---------- EK: taramadan seçilenler (Mürekkep ve Köz) ----------
  { s: "Hayat güzellikler içinde karanlığa göz kırpma sanatı gibi değil mi?", k: "mvk", p: 19, t: ["hayat", "karanlik"] },
  { s: "Hem zehrimle hem de şifamla tutunuyorum.", k: "mvk", p: 44, t: ["hayat", "kimlik"] },
  { s: "Üç mevsim yaşıyordum içimde: Aydınlık, karanlık ve rengarenk.", k: "mvk", p: 49, t: ["kimlik", "karanlik"] },
  { s: "Şarkılar, derdimi anlatan sessiz dilimin tercümesi. Şiirler, tutsak kalbimin anahtarları.", k: "mvk", p: 52, t: ["sanat"] },
  { s: "Hatırladım, gülümsedim, ağladım, kahrettim, unuttum, unutuldum.", k: "mvk", p: 58, t: ["zaman", "ask"] },
  { s: "Filler de unutur, ben unutur muyum?", k: "mvk", p: 66, t: ["ask", "zaman"] },
  { s: "Son defa sevilmek istiyorum.", k: "mvk", p: 67, t: ["ask"] },
  { s: "Bir yabancının aşkına ihtiyacım yok. Tanıdığım kendimi sevmeye ihtiyacım var.", k: "mvk", p: 69, t: ["ask", "kimlik"] },
  { s: "Bir kum tanesi kadarım şu evrende.", k: "mvk", p: 69, t: ["kimlik", "hayat"] },
  { s: "Küllerimden doğarım belki de bilinmeyen ülkemde.", k: "mvk", p: 75, t: ["yikim", "umut"] },
  { s: "Zaman az, yokuşlarla dolu dünyada. Çıkabildiğin kadar çık!", k: "mvk", p: 78, t: ["zaman", "umut"] },
  { s: "Ânı yaşadım, ani yaşadım.", k: "mvk", p: 80, t: ["zaman", "hayat"] },
  { s: "Gidenleri gömdüm kalbimin derinlerine. Kalanları aldım aklımın içine.", k: "mvk", p: 81, t: ["zaman", "ask"] },
  { s: "Aslında hiçbir şeyin fazlasına ihtiyacımız yok.", k: "mvk", p: 82, t: ["hayat"] },
  { s: "Sevmeyi sevdim, kaybettim.", k: "mvk", p: 84, t: ["ask"] },
  { s: "İnan ki ben bu yüzyıla alışamadım.", k: "mvk", p: 87, t: ["yalnizlik", "zaman"] },
  { s: "Çoktan defterleri yaktım. Çoktan anıları yaktım.", k: "mvk", p: 89, t: ["yikim", "zaman"] },
  { s: "Özlemeyi özledim ben, bilir misin?", k: "mvk", p: 92, t: ["ask", "zaman"] },
  { s: "Ne sevmeye doydum ne sevilmeye!", k: "mvk", p: 97, t: ["ask"] },
  { s: "Ah yalnızlığım bir sen kaldın bana bu dünyadan.", k: "mvk", p: 100, t: ["yalnizlik"] },
  { s: "Kişi nereyi seviyorsa orası evidir derler. Ben bir evsizim.", k: "mvk", p: 105, t: ["sehir", "yalnizlik"] },
  { s: "Siz susuzluktan ölebilirsiniz ama ben umudum bittiği an öleceğim.", k: "mvk", p: 110, t: ["umut"] },
  { s: "Hatalarımı halının altına süpüremiyorum.", k: "mvk", p: 111, t: ["yuzlesme"] },
  { s: "Ruhum özgürlükle yaşamazsa ölmüş kabul ederim kendimi.", k: "mvk", p: 113, t: ["ozgurluk"] },
  { s: "Bilmeyene labirent, bilenlere dev bir sanat galerisi gibisin.", k: "mvk", p: 115, t: ["sehir", "sanat"] },
  { s: "Ahtım var, bu dünyadan sevgisiz gitmeyeceğim.", k: "mvk", p: 117, t: ["ask", "umut"] },
  { s: "Terk etmedi beni. Terk ettim kendimi.", k: "mvk", p: 118, t: ["yuzlesme", "yalnizlik"] },
  { s: "Felaketim benim eserim.", k: "mvk", p: 118, t: ["yuzlesme", "kimlik"] },
  { s: "Geçmişimle barışıp kendim oluyorum, yaşıyorum.", k: "mvk", p: 120, t: ["zaman", "kimlik"] },
  { s: "Bugün kendime yakıştım. Sensizliğe alıştım.", k: "mvk", p: 138, t: ["kimlik", "ask"] },
  { s: "Hiçbir şey eskisi gibi olamaz. Hiçbir şey eskisi gibi kalamaz.", k: "mvk", p: 141, t: ["zaman"] },
  { s: "Sanat için varım, sanat uğruna öleceğim.", k: "mvk", p: 163, t: ["sanat"] },
  { s: "Siz zincir yaparken, ben o zincirlerden taç ördüm!", k: "mvk", p: 182, t: ["ozgurluk", "yikim"] },
  { s: "Bu hayat benim! Ve kimseye hesap vermem.", k: "mvk", p: 182, t: ["ozgurluk", "kimlik"] },

  // ---------- EK: taramadan seçilenler (Tasfiye) ----------
  { s: "Sahne boşaltılmadan, hakikat sahneye çıkamaz.", k: "tas", p: 8, t: ["yuzlesme", "yikim"] },
  { s: "Giyotinimizi kendi omuzlarımızda taşıyoruz ve bunu yaparken bir de kart basıyoruz.", k: "tas", p: 14, t: ["yuzlesme", "ozgurluk"] },
  { s: "Gerçek derinlik kanatır, uykusuz bırakır, insanı toplumun dışına iter.", k: "tas", p: 18, t: ["yuzlesme", "yalnizlik"] },
  { s: "Delirmiş olan siz değilsiniz, dünya delirmiş durumda ve sizin tek suçunuz bunun farkında olmanız.", k: "tas", p: 19, t: ["yuzlesme", "karanlik"] },
  { s: "Kendi zincirini seven köle, zincirini kırmak isteyenin de en azılı gardiyanına dönüşür.", k: "tas", p: 21, t: ["ozgurluk"] },
  { s: "Düşünmek, doğası gereği yıkıcı bir eylemdir.", k: "tas", p: 23, t: ["sanat", "yikim"] },
  { s: "Acının, rahatsızlığın ve belirsizliğin olmadığı yerde, büyüme de durur.", k: "tas", p: 39, t: ["hayat", "umut"] },
  { s: "Bir şeyin adını koyduğumuz an, anlamanın bittiğine dair o sahte rahatlama duygusuna teslim oluruz.", k: "tas", p: 50, t: ["yuzlesme", "sanat"] },
  { s: "Empati yeteneğini yitirmiş bir toplum, ne kadar silahlı olursa olsun, içten içe çökmeye mahkûmdur.", k: "tas", p: 56, t: ["yuzlesme"] },
  { s: "Kulluk bizi pürüzsüzleştirir, özgürlük ise bizi aşındırır, yorar ve şekillendirir.", k: "tas", p: 63, t: ["ozgurluk"] },
  { s: "Herkesin aykırı olduğu bir yerde, aykırılık yeni bir üniformaya, yeni bir mecburi repliğe dönüşür.", k: "tas", p: 65, t: ["kimlik", "yuzlesme"] },
  { s: "Mutlak kesinlik, empatiyi ve anlamayı öldürür.", k: "tas", p: 83, t: ["yuzlesme"] },
  { s: "Belki de insan olmanın en büyük ve en sessiz zaferi, hiçbir yere ait olmak zorunda kalmadan, tüm yalınlığıyla kendi kalabilmektir.", k: "tas", p: 87, t: ["kimlik", "ozgurluk"] },
  { s: "Bir medeniyetin asıl karakteri, neyi baş tacı ettiğinden çok, neyi iğrenerek kendinden uzaklaştırdığında gizlidir.", k: "tas", p: 90, t: ["yuzlesme"] },
  { s: "Aklını yitirmek, bir anlamda suflörün susmasıdır.", k: "tas", p: 93, t: ["karanlik", "sanat"] },
  { s: "Sistemin çarkları arasında bir şair olmak, öğütücü bir makinenin içine atılmış ince bir cam kristali olmaktır.", k: "tas", p: 95, t: ["sanat", "yalnizlik"] },
  { s: "Şiirin barınamadığı bir toplum, nefes borusu kesilmiş bir organizma gibi kendi zehrinde boğulmaya mahkûmdur.", k: "tas", p: 96, t: ["sanat"] },
  { s: "Gürültünün ve hızın kesilmediği bir yerde tohum çatlayamaz.", k: "tas", p: 96, t: ["sanat", "hayat"] },
  { s: "Belki de en büyük devrim, herkesin şuursuzca koştuğu bir düzende, ayakları yere sağlam basarak durmayı başarabilmektir.", k: "tas", p: 97, t: ["ozgurluk"] },
  { s: "Geçmiş, olduğu yerde kalmalıdır ki gelecek var olabilsin.", k: "tas", p: 101, t: ["zaman"] },
  { s: "Gidiyorum, çünkü kalmanın o yavaş çürümesine boyun eğmiyorum.", k: "tas", p: 102, t: ["ozgurluk", "sehir"] },
  { s: "İnsanın kökleri ayaklarında değil, zihnindedir.", k: "tas", p: 103, t: ["kimlik", "ozgurluk"] },
  { s: "Çürüyen şey, saklandığı yeri de çürütür.", k: "tas", p: 117, t: ["karanlik", "yuzlesme"] },
  { s: "Kendi karanlığına bakmaya korkanlar, başkalarının karanlığında hatalar ararlar.", k: "tas", p: 127, t: ["karanlik", "yuzlesme"] },
  { s: "Yalnızlık, bir ceza değil, bir zorunluluktur.", k: "tas", p: 127, t: ["yalnizlik"] },
  { s: "Kendin olmak için, önce herkesin senden beklediği kişi olmayı reddetmen gerekir.", k: "tas", p: 127, t: ["kimlik", "ozgurluk"] },
  { s: "Kimlik, bir çapa değil, bir yelkendir.", k: "tas", p: 130, t: ["kimlik", "ozgurluk"] },
  { s: "Kendi hayatını yazmak, başkasının kurgusuna figüran olmaktan çok daha sancılı, çok daha zor ama çok daha onurludur.", k: "tas", p: 143, t: ["kimlik", "sanat"] },
];

/* Geriye dönük uyumluluk: deneyimlerin okuduğu düz liste */
export const TUM_SOZLER: string[] = SOZLER.map((x) => x.s);

/* Temaya göre süz (Kâhin/Leke için) */
export function temadan(tema: string): string[] {
  return SOZLER.filter((x) => x.t.includes(tema)).map((x) => x.s);
}

/* ---- Söz sayfaları altyapısı ---- */
const TR_ASCII: Record<string, string> = { "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "û": "u", "î": "i" };

export function sozSlug(s: string): string {
  const kucuk = s.toLocaleLowerCase("tr").replace(/[çğıöşüâûî]/g, (c) => TR_ASCII[c] ?? c);
  const temiz = kucuk.replace(/[^a-z0-9\s-]/g, "");
  return temiz.split(/\s+/).filter(Boolean).slice(0, 7).join("-").slice(0, 64).replace(/-+$/, "");
}

export const KITAP_ADI: Record<"mvk" | "tas", string> = {
  mvk: "Mürekkep ve Köz",
  tas: "Tasfiye",
};

export const TEMA_ADI: Record<string, string> = {
  yikim: "Yıkım & Yeniden Doğuş",
  umut: "Umut",
  yalnizlik: "Yalnızlık",
  ask: "Aşk",
  sehir: "Şehir & İstanbul",
  yuzlesme: "Yüzleşme & Hesap",
  ozgurluk: "Özgürlük",
  kimlik: "Kimlik",
  zaman: "Zaman & Geçmiş",
  karanlik: "Karanlık & Gölge",
  hayat: "Hayat",
  sanat: "Sanat & Yazmak",
};

export const TEMALAR = Object.keys(TEMA_ADI);

export function sozBul(slug: string): Soz | undefined {
  return SOZLER.find((x) => sozSlug(x.s) === slug);
}

// İlgili sözler — ortak temaya göre (iç link ağı). Kendisi hariç, en çok
// tema paylaşanlar önce; deterministik (SSR/statik export güvenli).
export function ilgiliSozler(soz: Soz, n = 6): Soz[] {
  const puanli = SOZLER.filter((x) => x !== soz)
    .map((x) => ({ x, ortak: x.t.filter((t) => soz.t.includes(t)).length }))
    .filter((o) => o.ortak > 0)
    .sort((a, b) => b.ortak - a.ortak || SOZLER.indexOf(a.x) - SOZLER.indexOf(b.x));
  return puanli.slice(0, n).map((o) => o.x);
}

