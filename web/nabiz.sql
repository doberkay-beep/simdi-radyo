-- ŞİMDİ — Radyo Nabzı fonksiyonları.
-- /api/nabiz bunları çağırır. Supabase SQL Editor'de bir kez çalıştır.
-- Arşivdeki (plays) verinin gücüyle: son N saatte en çok çalan parça/sanatçı.

-- Son `saat` saatte en çok çalan parçalar.
create or replace function nabiz_top(saat int default 24)
returns table (title text, artist text, adet bigint)
language sql stable as $$
  select
    (array_agg(coalesce(nullif(p.title, ''), p.raw_title) order by p.started_at desc))[1] as title,
    (array_agg(p.artist order by p.started_at desc))[1] as artist,
    count(*) as adet
  from plays p
  where p.started_at >= now() - make_interval(hours => saat)
    and coalesce(nullif(p.title, ''), p.raw_title) is not null
    and length(coalesce(nullif(p.title, ''), p.raw_title)) between 2 and 120
  group by lower(coalesce(nullif(p.title, ''), p.raw_title))
  order by adet desc
  limit 30;
$$;

-- Son `saat` saatte en çok çalan sanatçılar.
create or replace function nabiz_artists(saat int default 24)
returns table (artist text, adet bigint)
language sql stable as $$
  select
    (array_agg(p.artist order by p.started_at desc))[1] as artist,
    count(*) as adet
  from plays p
  where p.started_at >= now() - make_interval(hours => saat)
    and p.artist is not null
    and p.artist <> ''
    and p.artist <> p.title
    and length(p.artist) between 2 and 60
  group by lower(p.artist)
  order by adet desc
  limit 30;
$$;

grant execute on function nabiz_top(int) to anon, authenticated;
grant execute on function nabiz_artists(int) to anon, authenticated;
