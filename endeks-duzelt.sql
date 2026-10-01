-- ŞİMDİ — Endeks "kayıtlı çalma" düzeltmesi (1 Eki 2026)
-- Sorun: toplam, yabancı istasyonlar ve kapalı (ikiz) istasyonlar dahil BÜTÜN
-- çalmaları sayıyordu; kartın başlığı ise "Türkiye Radyo Endeksi". Artık yalnız
-- Türk bandındaki aktif istasyonlar sayılır (liste ile aynı evren).
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
grant execute on function endeks_ozet(text) to anon, authenticated;
