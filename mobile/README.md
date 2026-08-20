# ŞİMDİ — Mobil (Expo)

Web ile aynı API'yi (necaliyor.co) kullanan yerel uygulama.

## Çalıştırma (geliştirme)

```bash
cd mobile
npx expo install   # bağımlılıkları SDK ile hizala
npx expo start
```

## Push bildirimleri (74)

Kod hazır (`push.ts` + `App.tsx` kaydı + web `/api/push/register`). Gerçekte
çalışması için:

1. **Bağımlılıklar:** `npx expo install expo-notifications expo-device expo-constants @react-native-async-storage/async-storage`
2. **EAS projesi:** `npx eas init` → çıkan `projectId`'yi `app.json`
   içindeki `extra.eas.projectId` alanına yaz (şu an `REPLACE_...`).
3. **Gerçek build:** Push jetonu **Expo Go'da üretilmez**; bir dev/EAS build gerekir:
   `npx eas build --profile development --platform ios` (veya android).
4. **Supabase:** `web/push.sql`'i bir kez çalıştır (jeton tablosu + RPC).
5. **Gönderim:** GitHub Actions → "Push gönder" iş akışı kayıtlı cihazlara
   "yükselen / eşzamanlı" bildirimi yollar (Expo push API). İstersen
   `.github/workflows/push-send.yml` içindeki `schedule` satırlarını açıp
   zamanla.

Uygulama açılışta izin ister, jetonu alır ve favori listesiyle birlikte
siteye kaydeder. İzin verilmezse hiçbir şey olmaz (sessiz).

## Kilit ekranı / arka plan sesi

`app.json`'da iOS `UIBackgroundModes: ["audio"]` ve
`setAudioModeAsync({ shouldPlayInBackground: true })` ile arka planda çalar.

## Managed Expo dışında kalanlar

- **Home-screen widget (75)** ve **Siri Shortcut (80):** native modül /
  config-plugin + EAS dev build ister; managed akışta doğrudan yapılamaz.
  Kilit ekranı oynatma kontrolleri bu ihtiyacın çoğunu karşılar.
