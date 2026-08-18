# /mobile — Faz 5: ŞİMDİ mobil uygulaması (Expo)

Aynı canlı veriyi telefona taşır: parça listesi, istasyon renkleri, dokununca
dinleme. Yayındaki API'yi (`necaliyor.co`) okur — kendi sunucusu yoktur.

Expo SDK 54 · React Native 0.81 · ses için `expo-audio`.

## Çalıştırma (geliştirme)

Telefonuna **Expo Go** uygulamasını kur (App Store / Play Store). Sonra:

```bash
cd mobile
npm install
npx expo start
```

Terminalde bir **QR kod** çıkar. Telefonda:
- **iPhone:** Kamera uygulamasıyla QR'ı okut → Expo Go'da açılır.
- **Android:** Expo Go içinden "Scan QR code".

Bilgisayar ve telefon **aynı Wi-Fi'de** olmalı.

## Yapısı
- `App.tsx` — tek ekran: `/api/now`'dan 15 sn'de bir okur, listeler, çalar.
- `index.ts` — uygulama girişi.
- `app.json` — Expo ayarları (isim, tema).
- Ses: `expo-audio` ile `/api/stream/[slug]` proxy'sinden çalar (HTTPS olduğu
  için iOS'ta sorunsuz).

## Notlar
- API adresi `App.tsx` içinde `API` sabitinde. Alan adı alınca burası güncellenir.
- Gerçek mağaza yayını (App Store / Play) ayrı bir adımdır (EAS Build);
  şimdilik Expo Go ile kendi telefonunda çalışır.
