-- ŞİMDİ — Disk IO düzeltmesi (6 Eki 2026)
-- Teşhis: önbellek isabeti %100 → IO'yu okumalar değil YAZMALAR tüketiyor.
-- plays'e saniyede ~1,5 satır ekleniyor ve her ekleme tablonun TÜM indekslerini günceller.
-- plays_sanatci_slug_idx (sarki_slug(artist)) gereksiz: plays_sarki_slug_idx
-- (sarki_slug(artist), sarki_slug(title)) aynı öncü sütunla sanatçı aramalarını zaten karşılar
-- (sanatci_ozet: where sarki_slug(p.artist) = p_slug → bileşik indeksin ilk sütunu).
-- Kaldırmak her eklemede bir indeks yazımını (ve WAL'ını) düşürür. Veri silinmez.
-- Supabase SQL Editor'de bir kez çalıştır; tekrar çalıştırmak güvenli.

drop index if exists plays_sanatci_slug_idx;

-- Kontrol: plays'te kalan indeksler (4 → 3 olmalı)
select indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) as boyut
from pg_indexes where tablename = 'plays' order by 1;
