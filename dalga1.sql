-- ŞİMDİ — DALGA 1: Senkron Anı + İstasyon Rozeti + Gece 3 Listesi (1 Eki 2026)
-- Supabase SQL Editor'de bir kez çalıştır; tekrar çalıştırmak güvenli.

-- ── 1) SENKRON ANLARI ─────────────────────────────────────────────────────
-- Aynı şarkı 4 dakika içinde 3+ Türk radyosunda birden başlarsa sunucudaki
-- nöbetçi (simdi-senkron) buraya yazar. Veri: 3 günde yalnız 2 kez oluyor —
-- nadir olduğu için değerli. Herkes okur; yalnız sunucu (service role) yazar.
create table if not exists senkron_anlari (
  id          bigserial primary key,
  anahtar     text not null,               -- katlanmış "sanatci|sarki"
  artist      text not null,
  title       text not null,
  istasyonlar jsonb not null default '[]'::jsonb,  -- [{slug, name, t}]
  sayi        int not null,
  ilk         timestamptz not null,
  son         timestamptz not null,
  olusturma   timestamptz not null default now()
);
create index if not exists senkron_anahtar_son on senkron_anlari (anahtar, son desc);
create index if not exists senkron_son on senkron_anlari (son desc);
alter table senkron_anlari enable row level security;
drop policy if exists "senkron herkes okur" on senkron_anlari;
create policy "senkron herkes okur" on senkron_anlari for select using (true);
grant select on senkron_anlari to anon, authenticated;

-- Canlı bant için Realtime yayınına ekle (zaten ekliyse sessizce geç).
do $$
begin
  alter publication supabase_realtime add table senkron_anlari;
exception when duplicate_object then null;
end $$;

-- ── 2) İSTASYON ÖZETİ (istasyon rozeti) ──────────────────────────────────
-- Son 7 günde: kaç çalma, kaç FARKLI şarkı, kaç farklı sanatçı, en sevdiği
-- şarkı ve sanatçılar. Jingle/istasyon adı/URL çöpü elenir.
create or replace function istasyon_ozet(p_slug text)
returns json
language sql stable
security definer
set search_path = public
as $$
  with st as (
    select id, name, slug, band from stations where slug = p_slug and is_active
  ),
  h as (
    select p.artist, p.title
    from plays p
    where p.station_id = (select id from st)
      and p.started_at > now() - interval '7 days'
      and coalesce(p.artist, '') <> '' and coalesce(p.title, '') <> ''
      and lower(p.artist) <> lower(p.title)
      and lower(p.artist) <> lower((select name from st))
      and lower(p.title)  <> lower((select name from st))
      and p.artist !~* '(https?:|www\.|\.com|\.net|<|jingle|reklam)'
      and p.title  !~* '(https?:|www\.|\.com|\.net|<|jingle|reklam|now playing)'
      and p.title !~ '~' and p.artist !~ '~'
  )
  select case when not exists (select 1 from st) then null else json_build_object(
    'ad', (select name from st),
    'band', (select band from st),
    'kez7', (select count(*) from h),
    'farkliSarki', (select count(distinct (sarki_slug(artist), sarki_slug(title))) from h),
    'farkliSanatci', (select count(distinct sarki_slug(artist)) from h),
    'sarki', (select row_to_json(x) from (
      select guzel_yazilis(array_agg(artist)) as artist, guzel_yazilis(array_agg(title)) as title, count(*) as kez
      from h group by sarki_slug(artist), sarki_slug(title) order by count(*) desc limit 1) x),
    'sanatcilar', (select coalesce(json_agg(x), '[]'::json) from (
      select guzel_yazilis(array_agg(artist)) as ad, count(*) as kez
      from h group by sarki_slug(artist) order by count(*) desc limit 3) x)
  ) end
$$;
grant execute on function istasyon_ozet(text) to anon, authenticated;

-- ── 3) GECE 3 LİSTESİ — Uykusuzların Listesi ─────────────────────────────
-- Son 7 gecenin 02:00–04:59 (TR) arası; Türk bandı, en az 2 istasyon.
create or replace function gece_listesi(adet int default 20)
returns table (artist text, title text, kez bigint, istasyon bigint)
language sql stable
security definer
set search_path = public
as $$
  select guzel_yazilis(array_agg(p.artist)) as artist,
         guzel_yazilis(array_agg(p.title)) as title,
         count(*) as kez, count(distinct p.station_id) as istasyon
  from plays p
  join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
  where p.started_at > now() - interval '7 days'
    and extract(hour from (p.started_at + interval '3 hours')) between 2 and 4
    and coalesce(p.artist, '') <> '' and coalesce(p.title, '') <> ''
    and lower(p.artist) <> lower(p.title)
    and lower(p.artist) <> lower(s.name)
    and p.artist !~* '(https?:|www\.|\.com|\.net|use http|<|jingle|reklam)'
    and p.title  !~* '(https?:|www\.|\.com|\.net|use http|<|now playing|jingle|reklam)'
    and p.title !~ '~' and p.artist !~ '~'
  group by sarki_slug(p.artist), sarki_slug(p.title)
  having count(distinct p.station_id) >= 2
  order by kez desc, istasyon desc
  limit adet;
$$;
grant execute on function gece_listesi(int) to anon, authenticated;

notify pgrst, 'reload schema';
