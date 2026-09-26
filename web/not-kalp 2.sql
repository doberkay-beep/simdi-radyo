-- ŞİMDİ — Kalp defteri notlarına kalp.
-- Supabase SQL Editor'de bir kez çalıştır (kalp-defteri.sql'den sonra).

alter table station_notes add column if not exists kalp integer not null default 0;

create or replace function not_kalp(p_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare yeni integer;
begin
  update station_notes set kalp = kalp + 1
  where id = p_id and gizli = false
  returning kalp into yeni;
  if yeni is null then
    raise exception 'not yok';
  end if;
  return yeni;
end $$;

grant execute on function not_kalp(bigint) to anon, authenticated;
