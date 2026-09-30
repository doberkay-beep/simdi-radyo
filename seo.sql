-- ŞİMDİ — Şarkı/Sanatçı SEO sayfaları veri katmanı.
-- Supabase SQL Editor'de BİR KEZ çalıştır (indeks oluşturma birkaç sn sürebilir).

-- Türkçe-dayanıklı slug: "İbrahim Tatlıses" → "ibrahim-tatlises".
-- Web tarafındaki lib/seoslug.ts ile BİREBİR aynı kural (değişirse ikisi birden).
create or replace function sarki_slug(t text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(t, ''), 'ÇĞİÖŞÜIÂÎÛçğıöşüâîû', 'cgiosuiaiucgiosuaiu')),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- Slug sorguları indeksten dönsün (sayfalar ISR ile saatte bir yeniler ama
-- ilk üretim hızlı olmalı).
create index if not exists plays_sanatci_slug_idx on plays (sarki_slug(artist));
create index if not exists plays_sarki_slug_idx on plays (sarki_slug(artist), sarki_slug(title));

-- Sanatçı özeti — sayfanın tüm verisi tek JSON'da.
create or replace function sanatci_ozet(p_slug text)
returns json
language sql stable
security definer
set search_path = public
as $$
  with h as (
    select p.artist, p.title, p.started_at, s.name as istasyon, s.slug as istasyon_slug
    from plays p join stations s on s.id = p.station_id and s.is_active
    where sarki_slug(p.artist) = p_slug
      and p.started_at > now() - interval '30 days'
      and coalesce(p.title, '') <> ''
  )
  select case when (select count(*) from h) = 0 then null else json_build_object(
    'ad', (select min(artist) from h),
    'kez7',  (select count(*) from h where started_at > now() - interval '7 days'),
    'kez30', (select count(*) from h),
    'istasyonSay', (select count(distinct istasyon_slug) from h),
    'sarkilar', (select coalesce(json_agg(x), '[]') from (
      select min(title) as title, sarki_slug(title) as slug, count(*) as kez
      from h group by sarki_slug(title) order by kez desc limit 10) x),
    'istasyonlar', (select coalesce(json_agg(x), '[]') from (
      select istasyon as name, istasyon_slug as slug, count(*) as kez
      from h group by istasyon, istasyon_slug order by kez desc limit 6) x),
    'sonlar', (select coalesce(json_agg(x), '[]') from (
      select title, istasyon as name, istasyon_slug as slug, started_at
      from h order by started_at desc limit 6) x),
    'suan', (select json_agg(x) from (
      select s.name, s.slug, np.title
      from now_playing np join stations s on s.id = np.station_id and s.is_active
      where sarki_slug(np.artist) = p_slug limit 3) x)
  ) end
$$;
grant execute on function sanatci_ozet(text) to anon, authenticated;

-- Şarkı özeti.
create or replace function sarki_ozet(p_aslug text, p_tslug text)
returns json
language sql stable
security definer
set search_path = public
as $$
  with h as (
    select p.artist, p.title, p.started_at, s.name as istasyon, s.slug as istasyon_slug
    from plays p join stations s on s.id = p.station_id and s.is_active
    where sarki_slug(p.artist) = p_aslug and sarki_slug(p.title) = p_tslug
      and p.started_at > now() - interval '30 days'
  )
  select case when (select count(*) from h) = 0 then null else json_build_object(
    'sanatci', (select min(artist) from h),
    'ad', (select min(title) from h),
    'kez7',  (select count(*) from h where started_at > now() - interval '7 days'),
    'kez30', (select count(*) from h),
    'istasyonlar', (select coalesce(json_agg(x), '[]') from (
      select istasyon as name, istasyon_slug as slug, count(*) as kez
      from h group by istasyon, istasyon_slug order by kez desc limit 8) x),
    'sonlar', (select coalesce(json_agg(x), '[]') from (
      select istasyon as name, istasyon_slug as slug, started_at
      from h order by started_at desc limit 8) x),
    'suan', (select json_agg(x) from (
      select s.name, s.slug
      from now_playing np join stations s on s.id = np.station_id and s.is_active
      where sarki_slug(np.artist) = p_aslug and sarki_slug(np.title) = p_tslug limit 3) x)
  ) end
$$;
grant execute on function sarki_ozet(text, text) to anon, authenticated;

-- Sitemap kataloğu: son 30 günde en az 3 kez çalan sanatçılar (en fazla 2000).
create or replace function seo_katalog()
returns table (slug text, kez bigint)
language sql stable
security definer
set search_path = public
as $$
  select sarki_slug(p.artist) as slug, count(*) as kez
  from plays p join stations s on s.id = p.station_id and s.is_active
  where p.started_at > now() - interval '30 days'
    and coalesce(p.artist, '') <> '' and lower(p.artist) <> lower(s.name)
    and p.artist !~* '(https?:|www\.|\.com|<)' and p.artist !~ '~'
  group by sarki_slug(p.artist)
  having count(*) >= 3
  order by kez desc
  limit 2000
$$;
grant execute on function seo_katalog() to anon, authenticated;
