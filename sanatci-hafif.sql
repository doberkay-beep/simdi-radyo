-- ŞİMDİ — Sanatçı sayfaları günlük özetten (7 Eki 2026)
-- Sorun: sanatci_ozet, sanatçının TÜM çalma kayıtlarını ham plays tablosundan
-- okuyordu (Sezen Aksu gibi büyük sanatçılarda binlerce dağınık disk okuması →
-- 25 sn, zaman aşımı → sayfa "bulunamadı"). Bu dosya:
--   1) gunluk_sayim'a sanatçı slug sütunu + dizin ekler, artık TEK çalmaları da tutar
--   2) gunluk_istasyon: gün × sanatçı × radyo sayımı (radyo listesi için)
--   3) gunluk_yaz'ı ikisini birden dolduracak şekilde yeniler, Ekim'i yeniden doldurur
--   4) sanatci_ozet'i özet tablolardan okuyacak şekilde yeniden yazar
-- Supabase SQL Editor'de bir kez çalıştır (Ekim'i doldururken 20-60 sn sürebilir).

-- 1) Sanatçı slug sütunu
alter table gunluk_sayim add column if not exists aslug text;
create index if not exists gunluk_sayim_aslug_idx on gunluk_sayim (aslug, gun);

-- 2) Radyo bazında sayım
create table if not exists gunluk_istasyon (
  gun        date not null,
  aslug      text not null,
  station_id bigint not null,
  kez        int not null,
  primary key (gun, aslug, station_id)
);
create index if not exists gunluk_istasyon_aslug_idx on gunluk_istasyon (aslug, gun);
alter table gunluk_istasyon enable row level security;
drop policy if exists "gunluk istasyon herkes okur" on gunluk_istasyon;
create policy "gunluk istasyon herkes okur" on gunluk_istasyon for select using (true);
grant select on gunluk_istasyon to anon, authenticated;

-- 3) Günlük yazıcı (iki tablo, tek tarama)
create or replace function gunluk_yaz(p_gun date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bas timestamptz := p_gun::timestamp at time zone 'Europe/Istanbul';
  v_bit timestamptz := (p_gun + 1)::timestamp at time zone 'Europe/Istanbul';
  n int;
begin
  delete from gunluk_sayim where gun = p_gun;
  delete from gunluk_istasyon where gun = p_gun;

  -- Tek tarama: günün temiz kayıtları → iki özet tabloya
  with ham as materialized (
    select p.artist, p.title, p.station_id
    from plays p
    join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
    where p.started_at >= v_bas and p.started_at < v_bit
      and coalesce(p.artist, '') <> '' and coalesce(p.title, '') <> ''
      and lower(p.artist) <> lower(p.title)
      and lower(p.artist) <> lower(s.name)
      and p.artist !~* '(https?:|www\.|\.com|\.net|use http|<)'
      and p.title  !~* '(https?:|www\.|\.com|\.net|use http|<|now playing)'
      and p.title  !~ '~' and p.artist !~ '~'
  ),
  ist as (
    insert into gunluk_istasyon (gun, aslug, station_id, kez)
    select p_gun, sarki_slug(artist), station_id, count(*)
    from ham group by sarki_slug(artist), station_id
    returning 1
  )
  insert into gunluk_sayim (gun, anahtar, artist, title, kez, istasyon, aslug)
  select p_gun, lower(artist) || '|' || lower(title), min(artist), min(title),
         count(*), count(distinct station_id), sarki_slug(min(artist))
  from ham
  group by lower(artist), lower(title);
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function gunluk_yaz(date) from public, anon, authenticated;

-- Ekim'i yeniden doldur (tek seferlik)
select gunluk_yaz(d::date) as satir, d::date as gun
from generate_series(date '2026-10-01', (now() at time zone 'Europe/Istanbul')::date, interval '1 day') d;

-- 4) Sanatçı özeti — özet tablolardan; ham plays yalnız "son çalınmalar" için, son 12 saat
create or replace function sanatci_ozet(p_slug text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with bugun as (select (now() at time zone 'Europe/Istanbul')::date as g),
  ss as (
    select gs.* from gunluk_sayim gs, bugun
    where gs.aslug = p_slug and gs.gun > bugun.g - 30
  ),
  ist as (
    select gi.station_id, sum(gi.kez)::int as kez
    from gunluk_istasyon gi, bugun
    where gi.aslug = p_slug and gi.gun > bugun.g - 30
    group by gi.station_id
  ),
  son as materialized (
    select p.artist, p.title, p.started_at, p.station_id
    from plays p
    where p.started_at > now() - interval '12 hours'
  )
  select case when (select count(*) from ss) = 0 then null else json_build_object(
    'ad', (select artist from ss group by artist order by sum(kez) desc limit 1),
    'kez7',  (select coalesce(sum(kez), 0) from ss, bugun where gun > bugun.g - 7),
    'kez30', (select coalesce(sum(kez), 0) from ss),
    'istasyonSay', (select count(*) from ist),
    'sarkilar', (select coalesce(json_agg(x), '[]') from (
      select min(title) as title, sarki_slug(min(title)) as slug, sum(kez)::int as kez
      from ss group by lower(title) order by 3 desc limit 10) x),
    'istasyonlar', (select coalesce(json_agg(x), '[]') from (
      select s.name, s.slug, ist.kez
      from ist join stations s on s.id = ist.station_id and s.is_active
      order by ist.kez desc limit 6) x),
    'sonlar', (select coalesce(json_agg(x), '[]') from (
      select son.title, s.name, s.slug, son.started_at
      from son join stations s on s.id = son.station_id and s.is_active
      where sarki_slug(son.artist) = p_slug and coalesce(son.title, '') <> ''
      order by son.started_at desc limit 6) x),
    'suan', (select json_agg(x) from (
      select s.name, s.slug, np.title
      from now_playing np join stations s on s.id = np.station_id and s.is_active
      where sarki_slug(np.artist) = p_slug limit 3) x)
  ) end
$$;
grant execute on function sanatci_ozet(text) to anon, authenticated;

-- 5) Trend de yeni sütunu kullansın (daha hızlı)
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
    where aslug = p_slug and gun > bugun.g - 30
    group by gun
  ),
  hafta as (select date_trunc('week', now() at time zone 'Europe/Istanbul')::date as bas),
  sarki as (
    select anahtar, min(artist) as artist, min(aslug) as aslug, sum(kez)::int as kez
    from gunluk_sayim, hafta where gun >= hafta.bas
    group by anahtar having max(istasyon) >= 2
  ),
  sanatci as (
    select min(aslug) as slug, sum(kez)::int as kez,
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

-- Kontrol (ikisi de 1 sn'nin altında dönmeli)
select (sanatci_ozet('sezen-aksu') ->> 'kez7') as sezen_7gun,
       (sanatci_ozet('sezen-aksu') ->> 'istasyonSay') as sezen_istasyon,
       (sanatci_trend('sezen-aksu') ->> 'hafta_sira') as sezen_hafta_sira,
       (select count(*) from gunluk_sayim) as gunluk_satir,
       (select count(*) from gunluk_istasyon) as istasyon_satir;
