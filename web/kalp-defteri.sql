-- ŞİMDİ — Kalp defteri (istasyona kısa anı bırak).
-- Supabase SQL Editor'de bir kez çalıştır. Hafif moderasyon: uzunluk sınırı,
-- link yasak, gizle bayrağı (istenmeyen notu sen SQL'den gizlersin).

create table if not exists station_notes (
  id bigint generated always as identity primary key,
  slug text not null,
  not_text text not null,
  created_at timestamptz not null default now(),
  gizli boolean not null default false
);

create index if not exists station_notes_slug_idx on station_notes (slug, created_at desc);

alter table station_notes enable row level security;

-- Yalnızca gizli olmayanlar okunur; yazma sadece RPC ile.
drop policy if exists "notlar okunur" on station_notes;
create policy "notlar okunur" on station_notes
  for select to anon, authenticated using (gizli = false);

create or replace function not_birak(p_slug text, p_not text)
returns table (id bigint, slug text, not_text text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare temiz text;
begin
  if p_slug is null or not exists (select 1 from stations where slug = p_slug and is_active) then
    raise exception 'istasyon yok';
  end if;
  temiz := btrim(coalesce(p_not, ''));
  if length(temiz) < 2 or length(temiz) > 140 then
    raise exception 'not 2-140 karakter olmalı';
  end if;
  if temiz ~* '(https?://|www\.|://)' then
    raise exception 'link kabul edilmiyor';
  end if;
  return query
  insert into station_notes (slug, not_text) values (p_slug, temiz)
  returning station_notes.id, station_notes.slug, station_notes.not_text, station_notes.created_at;
end $$;

grant execute on function not_birak(text, text) to anon, authenticated;

-- İstenmeyen bir notu gizlemek için (sen):
--   update station_notes set gizli = true where id = <id>;
