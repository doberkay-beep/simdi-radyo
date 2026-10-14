-- seo_katalog: site haritasındaki /sanatci sayfaları (14 Eki 2026).
-- Eski hali son 30 günün ham plays'ini (milyonlarca satır, satır başına
-- sarki_slug) tarıyordu → anon 8 sn statement_timeout → sitemap.ts hatayı
-- yutup sanatçısız harita üretiyordu (sitemap'te 0 /sanatci adresi).
-- Yeni hali günlük özet tablodan okur (gunluk_sayim.aslug, sanatci-hafif.sql).
-- Not: gunluk_sayim 1 Ekim'de başladı; 30 gün dolana dek pencere daha kısa.

create or replace function seo_katalog()
returns table (slug text, kez bigint)
language sql stable
security definer
set search_path = public
as $$
  with bugun as (select (now() at time zone 'Europe/Istanbul')::date as g)
  select gs.aslug as slug, sum(gs.kez)::bigint as kez
  from gunluk_sayim gs, bugun
  where gs.gun > bugun.g - 30
    and coalesce(gs.aslug, '') <> ''
  group by gs.aslug
  having sum(gs.kez) >= 3
  order by kez desc
  limit 2000
$$;
grant execute on function seo_katalog() to anon, authenticated;

-- Kontrol (SQL Editor'da çalıştırınca ilk 10 sanatçı ve toplam görünmeli):
-- select count(*) from seo_katalog();
-- select * from seo_katalog() limit 10;
