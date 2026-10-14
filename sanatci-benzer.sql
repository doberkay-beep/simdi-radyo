-- sanatci_benzer: sanatçı sayfasında "bu radyolarda bunlar da çalıyor" (14 Eki 2026).
-- Amaç: 2.000 /sanatci sayfasını birbirine bağlamak (iç bağlantı ağı → Google keşfi).
-- Yöntem: sanatçının en çok çaldığı 15 istasyonda, son 30 günde en çok ortak
-- istasyonda çalan diğer sanatçılar. Kaynak günlük özet tablo (gunluk_istasyon);
-- ham plays'e dokunmaz.

create index if not exists gunluk_istasyon_station_idx on gunluk_istasyon (station_id, gun);

create or replace function sanatci_benzer(p_slug text)
returns table (slug text, ad text, ortak int)
language sql stable
security definer
set search_path = public
as $$
  with bugun as (select (now() at time zone 'Europe/Istanbul')::date as g),
  ist as (
    select gi.station_id, sum(gi.kez) as k
    from gunluk_istasyon gi, bugun
    where gi.aslug = p_slug and gi.gun > bugun.g - 30
    group by gi.station_id
    order by k desc
    limit 15
  ),
  aday as (
    select gi.aslug,
           count(distinct gi.station_id) as ist_say,
           sum(least(gi.kez, 50)) as puan
    from gunluk_istasyon gi
    join ist on ist.station_id = gi.station_id, bugun
    where gi.gun > bugun.g - 30
      and gi.aslug <> p_slug
      and coalesce(gi.aslug, '') <> ''
    group by gi.aslug
    having count(distinct gi.station_id) >= 2
    order by ist_say desc, puan desc
    limit 12
  )
  select a.aslug as slug,
         (select gs.artist from gunluk_sayim gs
           where gs.aslug = a.aslug
           group by gs.artist order by sum(gs.kez) desc limit 1) as ad,
         a.ist_say::int as ortak
  from aday a
  order by a.ist_say desc, a.puan desc
$$;
grant execute on function sanatci_benzer(text) to anon, authenticated;

-- Kontrol:
-- select * from sanatci_benzer('hadise');
