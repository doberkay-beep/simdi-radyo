# /collector — Faz 1: Toplayıcı worker + veritabanı

ŞİMDİ'nin arka planı: sürekli çalışan bir Node worker, aktif istasyonların
"şimdi çalan" bilgisini yoklar ve **kalıcı olarak arşivler**. `plays` tablosu
projenin kalbidir — asla `UPDATE`/`DELETE` yapılmaz, sadece `INSERT`.

Serverless değildir; Railway ya da Fly.io gibi sürekli çalışan bir yerde durur.

## Kurulum

### 1. Veritabanı (Supabase)
1. supabase.com'da bir proje aç.
2. SQL Editor'de `schema.sql`'i çalıştır (tablolar + `plays` salt-ekleme kilidi + RLS).

### 2. Ortam değişkenleri
```bash
cd collector
cp .env.example .env.local
# .env.local içine SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY yaz.
```
`.env.local` **asla commit edilmez** (service_role anahtarı gizlidir).

### 3. Bağımlılıklar
```bash
npm install
```

### 4. Katalog (seed)
İstasyonlar Faz 0 raporundan **elle seçilir**, `collector/seed.json` dosyasına
yazılır (biçim için `seed.example.json`'a bak), sonra:
```bash
npm run seed
```
Katalog Radio Browser'dan canlı çekilmez — katalog bizim.

### 5. Worker'ı çalıştır
```bash
npm start
```

## Nasıl çalışır

- Her **25 sn**'de bir tüm aktif istasyonları yoklar, istekleri pencere içine yayar.
- `raw_title` bir öncekiyle **aynıysa hiçbir şey yazmaz**. `plays`'e yalnızca
  başlık gerçekten değişince yeni satır eklenir. Bu kural arşivin temizliğini belirler.
- Ayrıştırma: ilk ` - ` karakterinden böler → sanatçı / parça. Bölünemezse ikisi
  de `raw_title`.
- Bir istasyon üst üste **20 kez** başarısız olursa `is_active = false` yapılır ve loglanır.
- Yeniden başlatmada `now_playing`'den son başlıkları okuyup gereksiz tekrar
  yazmayı önler.

## Ayarlar (.env.local, hepsi isteğe bağlı)

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `POLL_INTERVAL_MS` | `25000` | Tüm istasyonları kaç ms'de bir yokla |
| `PROBE_TIMEOUT_MS` | `8000` | Tek istek zaman aşımı |
| `MAX_FAILURES` | `20` | Üst üste bu kadar başarısızlıkta pasifleştir |

## Test
```bash
npm test   # parseTitle testleri (ağ/DB gerektirmez)
```

## Dosyalar
- `schema.sql` — tablolar, indeksler, `plays` salt-ekleme trigger'ı, RLS
- `seed.example.json` — katalog biçimi örneği
- `src/worker.mjs` — ana döngü
- `src/icy.mjs` — ICY metadata okuyucu (ham soket)
- `src/parse.mjs` — başlık ayrıştırma
- `src/supabase.mjs` — veritabanı erişimi
- `src/seed.mjs` — katalog yükleyici
