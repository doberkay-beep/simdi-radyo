-- ŞİMDİ — Sanatçı sayfası trendi (7 Eki 2026)
-- gunluk_sayim'dan (ham plays'e dokunmaz): son 30 günün günlük çalma sayısı +
-- bu haftanın sanatçı sıralamasındaki yeri. Sayfa: /sanatci/[slug]
create or replace function sanatci_trend(p_slug text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with bugun as (select (now() at time zone 'Europe/Istanbul')::date as g),
  gunler as (
    select gun, sum(kez)::int as kez
    from gunluk_sayim, bugun
    where gun > bugun.g - 30 and sarki_slug(artist) = p_slug
    group by gun
  ),
  hafta as (select date_trunc('week', now() at time zone 'Europe/Istanbul')::date as bas),
  sarki as (
    select anahtar, min(artist) as artist, sum(kez)::int as kez
    from gunluk_sayim, hafta where gun >= hafta.bas
    group by anahtar having max(istasyon) >= 2
  ),
  sanatci as (
    select sarki_slug(min(artist)) as slug, sum(kez)::int as kez,
           row_number() over (order by sum(kez) desc) as sira
    from sarki group by lower(artist)
  )
  select json_build_object(
    'gunler', (select coalesce(json_agg(g order by gun), '[]'::json) from gunler g),
    'hafta_sira', (select sira from sanatci where slug = p_slug limit 1),
    'hafta_kez', (select kez from sanatci where slug = p_slug limit 1),
    'hafta_sanatci', (select count(*) from sanatci)
  );
$$;
grant execute on function sanatci_trend(text) to anon, authenticated;

-- Kontrol
select sanatci_trend('sezen-aksu') ->> 'hafta_sira' as sezen_aksu_hafta_sirasi,
       json_array_length(sanatci_trend('sezen-aksu') -> 'gunler') as gun_sayisi;
