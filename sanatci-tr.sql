-- ŞİMDİ — Sanatçı/şarkı özetleri yalnız TÜRK radyoları (3 Eki 2026)
-- Sorun: özetler bütün aktif istasyonları sayıyordu; yurt dışında aynı adlı başka
-- sanatçılar ("Manifest" adlı yabancı gruplar: 8radio, Radio Nowy Świat, UbuntuFM)
-- Türk Manifest'in sayısına karışıyordu. Rozet ve sayfa "Türkiye radyolarında" diyor →
-- yalnız TR bandı sayılır. Supabase SQL Editor'de bir kez çalıştır; tekrar güvenli.

-- ── Sanatçı özeti (sayfa + rozet) ──
create or replace function sanatci_ozet(p_slug text)
returns json
language sql stable
security definer
set search_path = public
as $$
  with h as (
    select p.artist, p.title, p.started_at, s.name as istasyon, s.slug as istasyon_slug
    from plays p join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
    where sarki_slug(p.artist) = p_slug
      and p.started_at > now() - interval '30 days'
      and coalesce(p.title, '') <> ''
  )
  select case when (select count(*) from h) = 0 then null else json_build_object(
    'ad', (select guzel_yazilis(array_agg(artist)) from h),
    'kez7',  (select count(*) from h where started_at > now() - interval '7 days'),
    'kez30', (select count(*) from h),
    'istasyonSay', (select count(distinct istasyon_slug) from h),
    -- Haftalık kırılım: rozet "BU HAFTA" dediğinde bütün sayılar aynı dönemden gelsin.
    'istasyonSay7', (select count(distinct istasyon_slug) from h where started_at > now() - interval '7 days'),
    'istasyonlar7', (select coalesce(json_agg(x), '[]') from (
      select istasyon as name, istasyon_slug as slug, count(*) as kez
      from h where started_at > now() - interval '7 days'
      group by istasyon, istasyon_slug order by kez desc limit 6) x),
    'sarkilar7', (select coalesce(json_agg(x), '[]') from (
      select guzel_yazilis(array_agg(title)) as title, sarki_slug(title) as slug, count(*) as kez
      from h where started_at > now() - interval '7 days'
      group by sarki_slug(title) order by kez desc limit 3) x),
    'sarkilar', (select coalesce(json_agg(x), '[]') from (
      select guzel_yazilis(array_agg(title)) as title, sarki_slug(title) as slug, count(*) as kez
      from h group by sarki_slug(title) order by kez desc limit 10) x),
    'istasyonlar', (select coalesce(json_agg(x), '[]') from (
      select istasyon as name, istasyon_slug as slug, count(*) as kez
      from h group by istasyon, istasyon_slug order by kez desc limit 6) x),
    'sonlar', (select coalesce(json_agg(x), '[]') from (
      select title, istasyon as name, istasyon_slug as slug, started_at
      from h order by started_at desc limit 6) x),
    'suan', (select json_agg(x) from (
      select s.name, s.slug, np.title
      from now_playing np join stations s on s.id = np.station_id and s.is_active and s.band = 'tr'
      where sarki_slug(np.artist) = p_slug limit 3) x)
  ) end
$$;
grant execute on function sanatci_ozet(text) to anon, authenticated;

-- ── Şarkı özeti ──
create or replace function sarki_ozet(p_aslug text, p_tslug text)
returns json
language sql stable
security definer
set search_path = public
as $$
  with h as (
    select p.artist, p.title, p.started_at, s.name as istasyon, s.slug as istasyon_slug
    from plays p join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
    where sarki_slug(p.artist) = p_aslug and sarki_slug(p.title) = p_tslug
      and p.started_at > now() - interval '30 days'
  )
  select case when (select count(*) from h) = 0 then null else json_build_object(
    'sanatci', (select guzel_yazilis(array_agg(artist)) from h),
    'ad', (select guzel_yazilis(array_agg(title)) from h),
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
      from now_playing np join stations s on s.id = np.station_id and s.is_active and s.band = 'tr'
      where sarki_slug(np.artist) = p_aslug and sarki_slug(np.title) = p_tslug limit 3) x)
  ) end
$$;
grant execute on function sarki_ozet(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
