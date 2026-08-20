-- ŞİMDİ — Radyo Nabzı (ek analizler).
-- Supabase SQL Editor'de bir kez çalıştır. Arşiv (plays) genç olduğu için
-- bu grafikler birkaç gün veri birikince anlam kazanır; boşken zarifçe gizlenir.

-- (86) En hareketli saat — son `gun` günde, günün saatine göre çalma sayısı.
-- Türkiye saatiyle (Europe/Istanbul) gruplar.
create or replace function nabiz_saat(gun int default 7)
returns table (saat int, adet bigint)
language sql stable as $$
  select
    extract(hour from (p.started_at at time zone 'Europe/Istanbul'))::int as saat,
    count(*) as adet
  from plays p
  where p.started_at >= now() - make_interval(days => gun)
  group by 1
  order by 1;
$$;

-- (88) Yükselen parçalar — son 6 saatte, önceki 6 saate göre artanlar.
create or replace function nabiz_trend()
returns table (title text, artist text, son bigint, onceki bigint)
language sql stable as $$
  with son6 as (
    select
      lower(coalesce(nullif(p.title, ''), p.raw_title)) as k,
      (array_agg(coalesce(nullif(p.title, ''), p.raw_title) order by p.started_at desc))[1] as title,
      (array_agg(p.artist order by p.started_at desc))[1] as artist,
      count(*) as c
    from plays p
    where p.started_at >= now() - interval '6 hours'
      and coalesce(nullif(p.title, ''), p.raw_title) is not null
      and length(coalesce(nullif(p.title, ''), p.raw_title)) between 2 and 120
    group by 1
  ),
  onceki6 as (
    select
      lower(coalesce(nullif(p.title, ''), p.raw_title)) as k,
      count(*) as c
    from plays p
    where p.started_at >= now() - interval '12 hours'
      and p.started_at <  now() - interval '6 hours'
      and coalesce(nullif(p.title, ''), p.raw_title) is not null
    group by 1
  )
  select s.title, s.artist, s.c::bigint as son, coalesce(o.c, 0)::bigint as onceki
  from son6 s
  left join onceki6 o on o.k = s.k
  where s.c >= 2 and s.c > coalesce(o.c, 0)
  order by (s.c - coalesce(o.c, 0)) desc, s.c desc
  limit 8;
$$;

grant execute on function nabiz_saat(int) to anon, authenticated;
grant execute on function nabiz_trend() to anon, authenticated;
