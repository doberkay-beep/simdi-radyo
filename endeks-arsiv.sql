-- ŞİMDİ — ENDEKS ARŞİVİ: yayınlanan ay DONAR (3 Eki 2026)
-- Sorun: endeks_ozet, istasyonların BUGÜNKÜ açık/kapalı durumuna bakarak hesaplıyordu;
-- katalog değişince (ör. 3 Eki'de 108 istasyon geri açıldı) yayınlanmış Eylül'ün sayısı
-- da değişti (50.767 → 52.204). Bir endeks için kabul edilemez: yayınlanan ay donmalı.
-- Çözüm: endeks_arsiv tablosu. Donmuş ay varsa endeks_ozet ONU döner; yoksa canlı hesaplar.
-- Supabase SQL Editor'de bir kez çalıştır; tekrar çalıştırmak güvenli.

create table if not exists endeks_arsiv (
  ay         text primary key check (ay ~ '^\d{4}-\d{2}$'),
  veri       json not null,
  donduruldu timestamptz not null default now(),
  aciklama   text
);
alter table endeks_arsiv enable row level security;
drop policy if exists "endeks arsiv herkes okur" on endeks_arsiv;
create policy "endeks arsiv herkes okur" on endeks_arsiv for select using (true);
grant select on endeks_arsiv to anon, authenticated;

-- Canlı hesap (eski endeks_ozet gövdesi, aynen): yalnız TR bandı aktif istasyonlar.
create or replace function endeks_hesapla(p_ay text)
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
  if v_bastan < '2026-08-01+03'::timestamptz or v_bastan > now() then return null; end if;
  v_devam := v_sona > now();
  if v_devam then v_sona := now(); end if;

  select count(*) into v_toplam
  from plays p join stations s on s.id = p.station_id and s.is_active and s.band = 'tr'
  where p.started_at >= v_bastan and p.started_at < v_sona;

  select coalesce(json_agg(row_to_json(l)), '[]'::json) into v_liste
  from liste_araligi(v_bastan, v_sona, 25) l;

  select row_to_json(x) into v_sanatci
  from (
    select l.artist as ad, sum(l.kez)::int as kez
    from liste_araligi(v_bastan, v_sona, 25) l
    group by l.artist order by 2 desc limit 1
  ) x;

  return json_build_object(
    'ay', p_ay, 'devam', v_devam, 'toplam', v_toplam,
    'sanatci', v_sanatci, 'liste', v_liste
  );
end;
$$;
grant execute on function endeks_hesapla(text) to anon, authenticated;

-- Herkese açık uç: donmuş ay varsa arşivden (değişmez), yoksa canlı hesap.
create or replace function endeks_ozet(p_ay text)
returns json
language plpgsql stable
security definer
set search_path = public
as $$
declare v json;
begin
  select veri into v from endeks_arsiv where ay = p_ay;
  if v is not null then return v; end if;
  return endeks_hesapla(p_ay);
end;
$$;
grant execute on function endeks_ozet(text) to anon, authenticated;

-- Dondurma: yalnız sunucu (service role) çağırabilir — aylık bot yayınlarken kullanır.
create or replace function endeks_dondur(p_ay text, p_aciklama text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare v json;
begin
  v := endeks_hesapla(p_ay);
  if v is null or (v->>'devam')::boolean then raise exception 'ay kapanmadan dondurulamaz: %', p_ay; end if;
  insert into endeks_arsiv (ay, veri, aciklama) values (p_ay, v, p_aciklama)
  on conflict (ay) do update set veri = excluded.veri, donduruldu = now(), aciklama = excluded.aciklama;
  return v;
end;
$$;
revoke execute on function endeks_dondur(text, text) from public, anon, authenticated;

-- ── EYLÜL 2026'YI DONDUR ──────────────────────────────────────────────────
-- Toplayıcı hatası düzeltildikten sonraki (eksiksiz) sayımla: 52.204 çalma;
-- Hadise "Ara Beni" ve Imael Angel "Bad Times" 50'şer kez berabere (eşitlikte
-- daha çok istasyonda çalan önde: Ara Beni 6, Bad Times 3 istasyon).
select endeks_dondur('2026-09',
  'İlk yayın (1 Eki) 50.767 çalmaydı; toplayıcının yanlışlıkla kapattığı istasyonlar 3 Eki''de geri açılınca eksiksiz sayımla donduruldu.');

notify pgrst, 'reload schema';
