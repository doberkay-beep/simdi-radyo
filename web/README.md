# /web — Faz 2 (+3): ŞİMDİ web uygulaması

ŞİMDİ'nin okuma katmanı ve (Faz 3'te) arayüzü. Kişisel siteden **ayrı** bir
Next.js uygulamasıdır çünkü canlı veri okuma + ses proxy'si için **sunucu**
gerekir (static export kullanılmaz).

Next.js 16 (App Router) + TypeScript. Veriyi Supabase'den **publishable (anon)**
anahtarla, yalnızca okuyarak alır (RLS ile korunur).

## Kurulum

```bash
cd web
cp .env.example .env.local     # SUPABASE_URL + SUPABASE_ANON_KEY (publishable) doldur
npm install
```

Arşiv ucu için Supabase SQL Editor'de bir kez `archive.sql`'i çalıştır
(veriyi sorgulayan `archive_at` fonksiyonunu kurar).

## Çalıştırma

```bash
npm run dev      # geliştirme (http://localhost:3000)
# ya da
npm run build && npm start
```

## API uçları

| Uç | İş | Cache |
|---|---|---|
| `GET /api/now` | Tüm aktif istasyonlar + şu an çalan parça | 10 sn (CDN) |
| `GET /api/stream/[slug]` | Ses akışı proxy'si (HTTP yayını HTTPS üzerinden geçirir) | yok |
| `GET /api/archive?date=YYYY-MM-DD&time=HH:MM` | O ana en yakın kayıtlar | 5 dk (geçmiş) |

- **`/api/stream`** akışı olduğu gibi geçirir; içeriğe dokunmaz, reklam kesmez.
  Türk istasyonlarının çoğu düz HTTP yayınlar; HTTPS sayfaya doğrudan gömülemez
  (mixed content), bu yüzden proxy zorunlu.
- **`/api/archive`** tarih/saati Türkiye saati (UTC+3) kabul eder. Parametresiz
  çağrılırsa "şu an"ı verir.

## Ortam değişkenleri

`.env.local` (asla commit edilmez):
- `SUPABASE_URL` — worker'daki ile aynı proje URL'i
- `SUPABASE_ANON_KEY` — `sb_publishable_...` (secret/service_role DEĞİL)

## Notlar
- Katalog ve arşiv verisini **toplayıcı worker** (`/collector`) üretir; bu
  uygulama yalnızca okur.
- Faz 3'te bu uygulamaya arayüz (parça listesi, çalan istasyonun rengi) eklenecek.
