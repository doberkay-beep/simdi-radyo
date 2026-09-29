-- ŞİMDİ — "şarkı değiştiği an" + ŞİMDİ LİSTESİ.
-- Supabase SQL Editor'de BİR KEZ çalıştır.

-- 1) Canlı değişim yayını: now_playing'deki her değişiklik tarayıcılara
--    Realtime ile anında düşer (web/lib/canli.ts → simdiDinle).
do $$
begin
  alter publication supabase_realtime add table now_playing;
exception
  when duplicate_object then null; -- zaten ekliyse sorun değil
end $$;

-- 2) ŞİMDİ LİSTESİ — verilen aralıkta en çok çalan şarkılar.
--    Aynı şarkının yazım farkları (BÜYÜK/küçük) tek satırda toplanır.
create or replace function liste_araligi(bastan timestamptz, sona timestamptz, adet int default 50)
returns table (artist text, title text, kez bigint, istasyon bigint)
language sql stable as $$
  select min(p.artist) as artist, min(p.title) as title,
         count(*) as kez, count(distinct p.station_id) as istasyon
  from plays p
  join stations s on s.id = p.station_id and s.is_active
  where p.started_at >= bastan and p.started_at < sona
    and coalesce(p.artist, '') <> '' and coalesce(p.title, '') <> ''
  group by lower(p.artist), lower(p.title)
  order by kez desc, istasyon desc
  limit adet;
$$;
grant execute on function liste_araligi(timestamptz, timestamptz, int) to anon, authenticated;

-- 3) Sanatçı sayacı — fandom'ların ekran görüntüsü alacağı sayılar.
create or replace function sanatci_araligi(q text, bastan timestamptz, sona timestamptz)
returns table (artist text, title text, kez bigint, istasyon bigint)
language sql stable as $$
  select min(p.artist) as artist, min(p.title) as title,
         count(*) as kez, count(distinct p.station_id) as istasyon
  from plays p
  join stations s on s.id = p.station_id and s.is_active
  where p.started_at >= bastan and p.started_at < sona
    and p.artist ilike '%' || q || '%'
    and coalesce(p.title, '') <> ''
  group by lower(p.artist), lower(p.title)
  order by kez desc
  limit 100;
$$;
grant execute on function sanatci_araligi(text, timestamptz, timestamptz) to anon, authenticated;
