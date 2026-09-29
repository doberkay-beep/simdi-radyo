-- ŞİMDİ — "şarkı değiştiği an" + ŞİMDİ LİSTESİ (v2: çöp süzgeçleri).
-- Supabase SQL Editor'de çalıştır (create or replace — üstüne yazar).

-- 1) Canlı değişim yayını: now_playing'deki her değişiklik tarayıcılara
--    Realtime ile anında düşer (web/lib/canli.ts → simdiDinle).
do $$
begin
  alter publication supabase_realtime add table now_playing;
exception
  when duplicate_object then null; -- zaten ekliyse sorun değil
end $$;

-- 2) ŞİMDİ LİSTESİ — Türkiye bandında, verilen aralıkta en çok çalan şarkılar.
--    Süzgeçler: yalnız band='tr'; jingle/reklam (artist=title ya da artist=istasyon adı),
--    URL/etiket çöpü, ham "~" metadata satırları elenir; gerçek hit en az 2 istasyonda
--    çalmış olmalı (tek istasyonluk otomasyon tekrarları listeye giremez).
create or replace function liste_araligi(bastan timestamptz, sona timestamptz, adet int default 50)
returns table (artist text, title text, kez bigint, istasyon bigint)
language sql stable as $$
  select min(p.artist) as artist, min(p.title) as title,
         count(*) as kez, count(distinct p.station_id) as istasyon
  from plays p
  join stations s on s.id = p.station_id and s.is_active
  where p.started_at >= bastan and p.started_at < sona
    and s.band = 'tr'
    and coalesce(p.artist, '') <> '' and coalesce(p.title, '') <> ''
    and lower(p.artist) <> lower(p.title)
    and lower(p.artist) <> lower(s.name)
    and p.artist !~* '(https?:|www\.|\.com|\.net|use http|<)'
    and p.title  !~* '(https?:|www\.|\.com|\.net|use http|<|now playing)'
    and p.title  !~ '~' and p.artist !~ '~'
  group by lower(p.artist), lower(p.title)
  having count(distinct p.station_id) >= 2
  order by kez desc, istasyon desc
  limit adet;
$$;
grant execute on function liste_araligi(timestamptz, timestamptz, int) to anon, authenticated;

-- 3) Sanatçı sayacı — aynı süzgeçler; tek istasyon şartı YOK (niş sanatçı
--    tek istasyonda da çalabilir), jingle elemeleri aynen geçerli.
create or replace function sanatci_araligi(q text, bastan timestamptz, sona timestamptz)
returns table (artist text, title text, kez bigint, istasyon bigint)
language sql stable as $$
  select min(p.artist) as artist, min(p.title) as title,
         count(*) as kez, count(distinct p.station_id) as istasyon
  from plays p
  join stations s on s.id = p.station_id and s.is_active
  where p.started_at >= bastan and p.started_at < sona
    and s.band = 'tr'
    and p.artist ilike '%' || q || '%'
    and coalesce(p.title, '') <> ''
    and lower(p.artist) <> lower(p.title)
    and lower(p.artist) <> lower(s.name)
    and p.artist !~* '(https?:|www\.|\.com|\.net|use http|<)'
    and p.title  !~* '(https?:|www\.|\.com|\.net|use http|<|now playing)'
    and p.title  !~ '~' and p.artist !~ '~'
  group by lower(p.artist), lower(p.title)
  order by kez desc
  limit 100;
$$;
grant execute on function sanatci_araligi(text, timestamptz, timestamptz) to anon, authenticated;
