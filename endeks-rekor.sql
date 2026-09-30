-- ŞİMDİ — ENDEKS + REKORLAR + BENZERLİK MOTORU (30 Eyl 2026)
-- Üç yeni okuma RPC'si; hepsi security definer + anon. Supabase SQL Editor'de
-- bir kez çalıştırılır; tekrar çalıştırmak güvenlidir (create or replace).

-- ── 1) AYLIK ENDEKS ───────────────────────────────────────────────────────
-- endeks_ozet('2026-09') → o takvim ayının (TR saatiyle) karnesi:
-- toplam kayıtlı çalma + liste_araligi'nden ilk 25 + ayın sanatçısı.
-- Ay bitmemişse "devam": true döner (sayım o âna kadar).
create or replace function endeks_ozet(p_ay text)
returns json
language plpgsql stable
security definer
set search_path = public
as $$
declare
  v_bastan timestamptz;
  v_sona   timestamptz;
  v_devam  boolean;
  v_toplam bigint;
  v_liste  json;
  v_sanatci json;
begin
  if p_ay !~ '^\d{4}-\d{2}$' then return null; end if;
  v_bastan := (p_ay || '-01')::timestamp at time zone 'Europe/Istanbul';
  v_sona   := ((p_ay || '-01')::date + interval '1 month') at time zone 'Europe/Istanbul';
  -- Arşiv öncesi ya da gelecek ay istenirse boş dön.
  if v_bastan < '2026-08-01+03'::timestamptz or v_bastan > now() then return null; end if;
  v_devam := v_sona > now();
  if v_devam then v_sona := now(); end if;

  select count(*) into v_toplam
  from plays where started_at >= v_bastan and started_at < v_sona;

  select coalesce(json_agg(row_to_json(l)), '[]'::json) into v_liste
  from liste_araligi(v_bastan, v_sona, 25) l;

  -- Ayın sanatçısı: ilk 25'teki toplamların zirvesi (endeks botuyla aynı usul).
  select row_to_json(s) into v_sanatci
  from (
    select l.artist as ad, sum(l.kez)::int as kez
    from liste_araligi(v_bastan, v_sona, 25) l
    group by l.artist order by 2 desc limit 1
  ) s;

  return json_build_object(
    'ay', p_ay, 'devam', v_devam, 'toplam', v_toplam,
    'sanatci', v_sanatci, 'liste', v_liste
  );
end;
$$;
grant execute on function endeks_ozet(text) to anon, authenticated;

-- ── 2) REKORLAR ───────────────────────────────────────────────────────────
-- rekorlar() → arşivin şov vitrini (TR bandı, son 90/30 gün pencereleri).
create or replace function rekorlar()
returns json
language sql stable
security definer
set search_path = public
as $$
with tr_ist as (select id, name, slug from stations where band = 'tr'),
temiz as (
  select p.artist, p.title, p.station_id, p.started_at,
         p.started_at at time zone 'Europe/Istanbul' as tr_ts
  from plays p
  join tr_ist s on s.id = p.station_id
  where p.started_at > now() - interval '90 days'
    and p.artist is not null and p.title is not null
    and p.artist <> p.title
    and p.title !~ '~' and length(p.title) between 2 and 80
),
gun_rekoru as (
  select artist, title, to_char(date_trunc('day', tr_ts), 'YYYY-MM-DD') as gun,
         count(*) as kez
  from temiz group by 1, 2, 3 order by kez desc limit 1
),
gece_krali as (
  select artist, title, count(*) as kez
  from temiz
  where extract(hour from tr_ts) between 0 and 5
    and started_at > now() - interval '30 days'
  group by 1, 2 order by kez desc limit 1
),
sabah_sampiyonu as (
  select artist, title, count(*) as kez
  from temiz
  where extract(hour from tr_ts) between 6 and 9
    and started_at > now() - interval '30 days'
  group by 1, 2 order by kez desc limit 1
),
genis_yayilim as (
  select artist, title, count(distinct station_id) as istasyon
  from temiz where started_at > now() - interval '30 days'
  group by 1, 2 order by istasyon desc, count(*) desc limit 1
),
sadik_iliski as (
  -- Bir istasyonun tek bir şarkıya 30 günlük en büyük aşkı.
  select t.artist, t.title, i.name as istasyon, count(*) as kez
  from temiz t join tr_ist i on i.id = t.station_id
  where t.started_at > now() - interval '30 days'
  group by 1, 2, 3 order by kez desc limit 1
),
arsiv as (
  select count(*) as toplam, min(started_at) as ilk from plays
)
select json_build_object(
  'gunRekoru',       (select row_to_json(g) from gun_rekoru g),
  'geceKrali',       (select row_to_json(g) from gece_krali g),
  'sabahSampiyonu',  (select row_to_json(s) from sabah_sampiyonu s),
  'genisYayilim',    (select row_to_json(y) from genis_yayilim y),
  'sadikIliski',     (select row_to_json(s) from sadik_iliski s),
  'arsiv',           (select row_to_json(a) from arsiv a)
);
$$;
grant execute on function rekorlar() to anon, authenticated;

-- ── 3) BENZERLİK MOTORU ───────────────────────────────────────────────────
-- benzerler('hey-radyo') → son 30 günde ortak çalınan şarkı oranına göre
-- (Jaccard) en yakın 6 istasyon. Veriden gelir, elle liste tutulmaz.
create or replace function benzerler(p_slug text)
returns json
language sql stable
security definer
set search_path = public
as $$
with hedef as (select id from stations where slug = p_slug),
pencere as (
  select station_id, artist, title
  from plays
  where started_at > now() - interval '30 days'
    and artist is not null and title is not null and artist <> title
),
x as (
  select distinct artist, title from pencere
  where station_id = (select id from hedef)
),
toplamlar as (
  select station_id, count(distinct (artist, title)) as c
  from pencere group by 1
),
ortaklar as (
  select p.station_id, count(distinct (p.artist, p.title)) as ortak
  from pencere p join x on x.artist = p.artist and x.title = p.title
  where p.station_id <> (select id from hedef)
  group by 1
)
select coalesce(json_agg(row_to_json(b)), '[]'::json)
from (
  select s.slug, s.name, s.genre, s.accent_color,
         o.ortak,
         round(o.ortak::numeric / ((select count(*) from x) + t.c - o.ortak), 3) as skor
  from ortaklar o
  join toplamlar t on t.station_id = o.station_id
  join stations s on s.id = o.station_id and s.is_active
  where o.ortak >= 8
  order by skor desc, o.ortak desc
  limit 6
) b;
$$;
grant execute on function benzerler(text) to anon, authenticated;
