-- ŞİMDİ — SANATÇI ARAMA + HAFIZA KASASI (1 Eki 2026)
-- Supabase SQL Editor'de bir kez çalıştırılır; tekrar çalıştırmak güvenlidir.

-- ── 1) SANATÇI ARAMA ──────────────────────────────────────────────────────
-- sanatci_ara('hadi') → son 30 günde çalınmış, adı eşleşen en fazla 8 sanatçı.
-- Türkçe-dayanıklı: sarki_slug ile karşılaştırır ("HADİSE" = "hadise").
-- Baştan eşleşenler önce, sonra çok çalınanlar.
create or replace function sanatci_ara(q text)
returns json
language sql stable
security definer
set search_path = public
as $$
with n as (select sarki_slug(q) as s)
select coalesce(json_agg(row_to_json(x)), '[]'::json)
from (
  select sarki_slug(p.artist) as slug,
         mode() within group (order by p.artist) as ad,
         count(*)::int as kez,
         count(distinct p.station_id)::int as istasyon,
         max(p.started_at) as son
  from plays p
  join stations st on st.id = p.station_id and st.is_active
  where p.started_at > now() - interval '30 days'
    and length((select s from n)) >= 2
    and sarki_slug(p.artist) like '%' || (select s from n) || '%'
    and lower(p.artist) <> lower(st.name)
    and p.artist !~* '(https?:|www\.|\.com|\.net|<|radyo|jingle)'
    and p.artist !~ '~'
  group by sarki_slug(p.artist)
  order by (sarki_slug(p.artist) like (select s from n) || '%') desc, count(*) desc
  limit 8
) x;
$$;
grant execute on function sanatci_ara(text) to anon, authenticated;

-- ── 2) HAFIZA KASASI ──────────────────────────────────────────────────────
-- Üyeliksiz yedek: tarayıcı favorileri/müzik defterini/takip listesini 10
-- haneli bir kodla buraya yazar; kod başka cihazda girilince geri gelir.
-- Tabloya doğrudan erişim YOK (RLS açık, politika yok) — yalnız iki RPC.
create table if not exists kasa (
  kod    text primary key check (kod ~ '^[A-Z2-9]{10}$'),
  veri   jsonb not null default '{}'::jsonb,
  guncel timestamptz not null default now()
);
alter table kasa enable row level security;

create or replace function kasa_yaz(p_kod text, p_veri jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if upper(p_kod) !~ '^[A-Z2-9]{10}$' then raise exception 'gecersiz kod'; end if;
  if pg_column_size(p_veri) > 131072 then raise exception 'kasa cok buyuk'; end if;
  insert into kasa (kod, veri, guncel) values (upper(p_kod), p_veri, now())
  on conflict (kod) do update set veri = excluded.veri, guncel = now();
end;
$$;
grant execute on function kasa_yaz(text, jsonb) to anon, authenticated;

create or replace function kasa_oku(p_kod text)
returns jsonb
language sql stable
security definer
set search_path = public
as $$
  select veri from kasa where kod = upper(p_kod)
$$;
grant execute on function kasa_oku(text) to anon, authenticated;

notify pgrst, 'reload schema';
