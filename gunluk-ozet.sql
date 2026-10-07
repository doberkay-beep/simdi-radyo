-- ŞİMDİ — Hafif özet altyapısı (7 Eki 2026)
-- 7 Eki 01:33'te veritabanı kilitlendi: ana_ozet_yaz(true) her 30 dakikada ayın
-- TÜM kayıtlarını tarıyordu (Nano sunucu + takas + disk bütçesi → kilit).
-- Bu dosya onun yerini alır:
--   * gunluk_sayim: her gün için şarkı başına sayım (bir kez hesaplanır, sonra okunur)
--   * ana_ozet_hafif(): 5 dakikada bir — ay toplamı ARTIMLI (yalnız yeni kayıtlar), son 3 saat
--   * ana_ozet_ay(): ayın ilk 5'i + ayın sanatçısı, günlük tablodan (ham veriye dokunmaz)
-- Supabase SQL Editor'de bir kez çalıştır; tekrar çalıştırmak güvenli.

-- 0) Eski zamanlayıcılar kapalı kalsın (zaten kaldırıldıysa bir şey yapmaz)
select cron.unschedule(jobid) from cron.job
 where jobname in ('ana-ozet-30dk', 'ana-ozet-5dk', 'ana-ozet-hafif', 'gunluk-bugun', 'gunluk-dun');
drop function if exists ana_ozet_yaz(boolean);

-- 1) Günlük sayım tablosu (endeks süzgeçleriyle aynı kurallar; günde en az 2 çalma)
create table if not exists gunluk_sayim (
  gun      date not null,
  anahtar  text not null,          -- lower(artist) || '|' || lower(title)
  artist   text not null,
  title    text not null,
  kez      int  not null,
  istasyon int  not null,
  primary key (gun, anahtar)
);
alter table gunluk_sayim enable row level security;
drop policy if exists "gunluk herkes okur" on gunluk_sayim;
create policy "gunluk herkes okur" on gunluk_sayim for select using (true);
grant select on gunluk_sayim to anon, authenticated;

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
  insert into gunluk_sayim (gun, anahtar, artist, title, kez, istasyon)
  select p_gun, lower(p.artist) || '|' || lower(p.title), min(p.artist), min(p.title),
         count(*), count(distinct p.station_id)
  from plays p
  join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
  where p.started_at >= v_bas and p.started_at < v_bit
    and coalesce(p.artist, '') <> '' and coalesce(p.title, '') <> ''
    and lower(p.artist) <> lower(p.title)
    and lower(p.artist) <> lower(s.name)
    and p.artist !~* '(https?:|www\.|\.com|\.net|use http|<)'
    and p.title  !~* '(https?:|www\.|\.com|\.net|use http|<|now playing)'
    and p.title  !~ '~' and p.artist !~ '~'
  group by lower(p.artist), lower(p.title)
  having count(*) >= 2;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function gunluk_yaz(date) from public, anon, authenticated;

-- 2) 5 dakikalık hafif özet: ay toplamı artımlı + son 3 saatin listesi
create or replace function ana_ozet_hafif()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ay     text := to_char(now() at time zone 'Europe/Istanbul', 'YYYY-MM');
  v_bas    timestamptz := (to_char(now() at time zone 'Europe/Istanbul', 'YYYY-MM') || '-01')::timestamp at time zone 'Europe/Istanbul';
  v_eski   jsonb;
  v_son    bigint;
  v_max    bigint;
  v_toplam bigint;
  v_saat   jsonb;
begin
  select veri into v_eski from ana_ozet where id = 1;
  v_son := nullif(v_eski->>'son_id', '')::bigint;
  select max(id) into v_max from plays;

  if v_son is null or coalesce(v_eski->>'ay', '') <> v_ay or coalesce(v_eski->>'sayim', '') <> 'artimli' then
    -- Tam sayım yalnız ilk kurulumda ve ay başında
    select count(*) into v_toplam
    from plays p join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
    where p.started_at >= v_bas and p.id <= v_max;
  else
    -- Artımlı: yalnız son sayımdan bu yana gelen kayıtlar (birincil anahtar aralığı)
    select coalesce((v_eski->>'ay_toplam')::bigint, 0) + count(*) into v_toplam
    from plays p join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
    where p.id > v_son and p.id <= v_max;
  end if;

  select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) into v_saat
  from liste_araligi(now() - interval '3 hours', now(), 10) l;

  update ana_ozet
     set veri = veri || jsonb_build_object('ay', v_ay, 'ay_toplam', v_toplam, 'son_id', v_max,
                                           'sayim', 'artimli', 'son3saat', v_saat, 'saat_guncel', now()),
         guncel = now()
   where id = 1;
end;
$$;
revoke execute on function ana_ozet_hafif() from public, anon, authenticated;

-- 3) Ayın ilk 5'i + ayın sanatçısı — günlük tablodan (küçük tablo, hızlı)
create or replace function ana_ozet_ay()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ilk date := date_trunc('month', now() at time zone 'Europe/Istanbul')::date;
  v_ilk5 jsonb;
  v_sanatci jsonb;
begin
  -- Yalnız en az 2 radyoda çalan şarkılar (tek radyonun döngüsü sayılmaz)
  with sarki as (
    select anahtar, min(artist) as artist, min(title) as title, sum(kez)::int as kez, max(istasyon) as istasyon
    from gunluk_sayim where gun >= v_ilk
    group by anahtar having max(istasyon) >= 2
  )
  select coalesce((select jsonb_agg(to_jsonb(x)) from (
           select artist, title, kez, istasyon from sarki order by kez desc limit 5) x), '[]'::jsonb),
         (select to_jsonb(y) from (
           select min(artist) as ad, sum(kez)::int as kez from sarki
           group by lower(artist) order by 2 desc limit 1) y)
    into v_ilk5, v_sanatci;

  update ana_ozet
     set veri = veri || jsonb_build_object('ay_ilk5', v_ilk5, 'ay_sanatci', v_sanatci, 'ay_guncel', now())
   where id = 1;
end;
$$;
revoke execute on function ana_ozet_ay() from public, anon, authenticated;

-- 4) Ekim'in günlerini bir kez doldur (tek seferlik; birkaç saniye sürebilir)
select gunluk_yaz(d::date) as satir, d::date as gun
from generate_series(date '2026-10-01', (now() at time zone 'Europe/Istanbul')::date, interval '1 day') d;

-- 5) Zamanlayıcılar
--   5 dk: hafif özet · 3 saatte bir (:17): bugünün günlük sayımı + ayın listesi · gece 00:25 (TR): dünü kesinleştir
select cron.schedule('ana-ozet-hafif', '*/5 * * * *', $$select ana_ozet_hafif()$$);
select cron.schedule('gunluk-bugun', '17 */3 * * *',
  $$select gunluk_yaz((now() at time zone 'Europe/Istanbul')::date); select ana_ozet_ay()$$);
select cron.schedule('gunluk-dun', '25 21 * * *',
  $$select gunluk_yaz((now() at time zone 'Europe/Istanbul')::date - 1); select ana_ozet_ay()$$);

-- 6) İlk doldurma + kontrol
select ana_ozet_hafif();
select ana_ozet_ay();
select veri->>'ay' as ay, veri->>'ay_toplam' as ay_toplam, veri->>'sayim' as sayim,
       jsonb_array_length(veri->'son3saat') as son3saat, jsonb_array_length(veri->'ay_ilk5') as ay_ilk5,
       veri->'ay_sanatci'->>'ad' as ay_sanatci,
       (select count(*) from gunluk_sayim) as gunluk_satir,
       (select string_agg(jobname, ', ') from cron.job) as zamanlayicilar
from ana_ozet;
