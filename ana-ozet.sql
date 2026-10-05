-- ŞİMDİ — Ana sayfa canlı vitrini (6 Eki 2026)
-- Ana sayfa artık ayın canlı endeks sayacını ve "son 3 saatte en çok çalanlar"ı gösteriyor.
-- Her ziyaretçi için ağır sorgu çalıştırmak yerine (endeks_hesapla 8 sn sınırına takılıyordu)
-- veritabanı kendi zamanlayıcısıyla (pg_cron) TEK SATIRLIK bir özet yazar; site yalnız o satırı okur.
--   * her 5 dk: ay toplamı + son 3 saatin ilk 10'u (hafif)
--   * her 30 dk: ayın ilk 5'i + ayın sanatçısı (ağır; arka planda, zaman aşımı yok)
-- Supabase SQL Editor'de bir kez çalıştır; tekrar çalıştırmak güvenli.

create extension if not exists pg_cron;

create table if not exists ana_ozet (
  id     int primary key default 1 check (id = 1),
  veri   jsonb not null default '{}'::jsonb,
  guncel timestamptz not null default now()
);
alter table ana_ozet enable row level security;
drop policy if exists "ana ozet herkes okur" on ana_ozet;
create policy "ana ozet herkes okur" on ana_ozet for select using (true);
grant select on ana_ozet to anon, authenticated;
insert into ana_ozet (id) values (1) on conflict (id) do nothing;

create or replace function ana_ozet_yaz(p_ay boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ay     text := to_char(now() at time zone 'Europe/Istanbul', 'YYYY-MM');
  v_bas    timestamptz := (to_char(now() at time zone 'Europe/Istanbul', 'YYYY-MM') || '-01')::timestamp at time zone 'Europe/Istanbul';
  v_toplam bigint;
  v_saat   jsonb;
  v_ek     jsonb := '{}'::jsonb;
begin
  -- Ayın toplam çalması (yalnız Türkiye bandı, aktif istasyonlar — endeks ile aynı kural)
  select count(*) into v_toplam
  from plays p join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
  where p.started_at >= v_bas;

  -- Son 3 saatte en çok çalanlar (endeks süzgeçleriyle; en az 2 istasyon)
  select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) into v_saat
  from liste_araligi(now() - interval '3 hours', now(), 10) l;

  if p_ay then
    v_ek := jsonb_build_object(
      'ay_ilk5', (select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) from liste_araligi(v_bas, now(), 5) l),
      'ay_sanatci', (select to_jsonb(x) from (
          select l.artist as ad, sum(l.kez)::int as kez
          from liste_araligi(v_bas, now(), 25) l
          group by l.artist order by 2 desc limit 1) x),
      'ay_guncel', now()
    );
  end if;

  update ana_ozet
     set veri = veri || jsonb_build_object('ay', v_ay, 'ay_toplam', v_toplam, 'son3saat', v_saat, 'saat_guncel', now()) || v_ek,
         guncel = now()
   where id = 1;
end;
$$;
revoke execute on function ana_ozet_yaz(boolean) from public, anon, authenticated;

-- Zamanlayıcı (aynı adla yeniden kurulursa günceller)
select cron.schedule('ana-ozet-5dk',  '*/5 * * * *',  $$select ana_ozet_yaz(false)$$);
select cron.schedule('ana-ozet-30dk', '2,32 * * * *', $$select ana_ozet_yaz(true)$$);

-- İlk doldurma (hemen) ve kontrol
select ana_ozet_yaz(true);
select veri->>'ay' as ay, veri->>'ay_toplam' as ay_toplam,
       jsonb_array_length(veri->'son3saat') as son3saat, jsonb_array_length(veri->'ay_ilk5') as ay_ilk5,
       veri->'ay_sanatci'->>'ad' as ay_sanatci, guncel
from ana_ozet;
