# /probe — keşif scriptleri (atılabilir)

Ürün kodu değil; katalog için istasyon keşfetmeye yarar.

## Türkçe tür taraması

Radio Browser'dan tür etiketli (tsm, türkü, arabesk, pop, rock, caz, klasik,
elektronik, alternatif...) TR istasyonlarını çeker, ICY metadata için yoklar,
çalışanları rapora yazar.

```bash
node probe/genre-probe.mjs
```

Çıktı: `probe/tur-rapor.csv` (sütunlar: tur, istasyon, uuid, url, codec, bitrate,
kalite, ornek_baslik). Terminale kalite özeti basar.

**Ağ gerekir** (Radio Browser'a bağlanır) — kendi makinende çalıştır. Sonra
`good` çıkan istasyonları bana ver; `collector/seed.json`'a türleriyle eklerim,
tek tıkla katalog güncellenir (GitHub Actions → "Katalog yükle").

ICY okuyucuyu `collector/src/icy.mjs`'den tekrar kullanır (kopya yok).
