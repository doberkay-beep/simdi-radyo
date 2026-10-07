-- ŞİMDİ — Haftalık Türkiye Radyo Raporu (7 Eki 2026)
-- gunluk-ozet.sql'den SONRA çalıştır (gunluk_sayim tablosunu okur; ham plays'e dokunmaz).
-- Hafta = Pazartesi–Pazar (İstanbul). Sayfa: necaliyor.co/rapor

-- 0) Düzeltme (7 Eki): ayın sanatçısı yalnız ≥2 radyoda çalan şarkılardan (tek radyonun döngüsü "- irvess" sayılıyordu)
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
select ana_ozet_ay();

create or replace function hafta_raporu(p_bas date)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with bu as (
    select anahtar, min(artist) as artist, min(title) as title, sum(kez)::int as kez, max(istasyon) as istasyon
    from gunluk_sayim where gun >= p_bas and gun < p_bas + 7
    group by anahtar having max(istasyon) >= 2
  ),
  once as (
    select anahtar, sum(kez)::int as kez
    from gunluk_sayim where gun >= p_bas - 7 and gun < p_bas
    group by anahtar having max(istasyon) >= 2
  ),
  bu_s   as (select *, row_number() over (order by kez desc, istasyon desc) as sira from bu),
  once_s as (select *, row_number() over (order by kez desc) as sira from once),
  ilk20 as (
    select b.artist, b.title, b.kez, b.istasyon, b.sira, o.sira as onceki_sira
    from bu_s b left join once_s o using (anahtar)
    where b.sira <= 20
  ),
  sanatci as (
    select min(artist) as ad, sum(kez)::int as kez, count(*)::int as sarki
    from bu group by lower(artist) order by 2 desc limit 5
  ),
  yukselen as (
    select b.artist, b.title, b.kez, o.kez as onceki
    from bu b join once o using (anahtar)
    where b.kez >= 10 and b.kez > o.kez
    order by (b.kez - o.kez) desc limit 3
  ),
  yeni as (
    select b.artist, b.title, b.kez
    from bu_s b left join once o using (anahtar)
    where o.anahtar is null and b.sira <= 50
    order by b.kez desc limit 3
  )
  select json_build_object(
    'bas', p_bas,
    'bit', p_bas + 6,
    'gun_sayisi', (select count(distinct gun) from gunluk_sayim where gun >= p_bas and gun < p_bas + 7),
    'onceki_var', exists (select 1 from gunluk_sayim where gun >= p_bas - 7 and gun < p_bas),
    'liste_calma', (select coalesce(sum(kez), 0) from bu),
    'ilk20', (select coalesce(json_agg(i order by sira), '[]'::json) from ilk20 i),
    'sanatcilar', (select coalesce(json_agg(s), '[]'::json) from sanatci s),
    'yukselen', (select coalesce(json_agg(y), '[]'::json) from yukselen y),
    'yeni', (select coalesce(json_agg(n), '[]'::json) from yeni n)
  );
$$;
grant execute on function hafta_raporu(date) to anon, authenticated;

-- Kontrol: bu haftanın raporu
select hafta_raporu(date_trunc('week', now() at time zone 'Europe/Istanbul')::date) ->> 'gun_sayisi' as bu_hafta_gun,
       (select veri->'ay_sanatci'->>'ad' from ana_ozet where id = 1) as ay_sanatci;
