-- ŞİMDİ — Disk IO teşhisi (6 Eki 2026). YALNIZ OKUR, hiçbir şeyi değiştirmez.
-- Supabase SQL Editor'de çalıştır; sonuç tablosunun ekran görüntüsünü gönder.
-- Tek sorgu, tek tablo: hangi sorgu/tablo diski en çok okuyor?

with sorgular as (
  select 'SORGU' as tur,
         left(regexp_replace(query, '\s+', ' ', 'g'), 90) as ad,
         calls as sayi,
         shared_blks_read as diskten_okunan_blok,
         round(total_exec_time)::bigint as toplam_ms
  from pg_stat_statements
  order by shared_blks_read desc
  limit 12
),
tablolar as (
  select 'TABLO' as tur,
         relname || ' (' || pg_size_pretty(pg_total_relation_size(relid)) || ', ölü satır ' || n_dead_tup || ')' as ad,
         seq_scan as sayi,
         seq_tup_read as diskten_okunan_blok,
         n_tup_ins as toplam_ms
  from pg_stat_user_tables
  order by pg_total_relation_size(relid) desc
  limit 6
),
onbellek as (
  select 'ÖNBELLEK' as tur,
         'isabet oranı %' || round(100.0 * sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 1) as ad,
         null::bigint, sum(heap_blks_read)::bigint, null::bigint
  from pg_statio_user_tables
)
select * from onbellek
union all select * from tablolar
union all select * from sorgular;

-- Okuma kılavuzu: TABLO satırlarında "sayi" = tam tablo taraması (seq scan) sayısı,
-- "diskten_okunan_blok" = taranan satır, "toplam_ms" = eklenen satır.
-- SORGU satırlarında en üstteki birkaç sorgu Disk IO'nun asıl sahibidir.
