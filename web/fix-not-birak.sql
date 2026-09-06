-- DÜZELTME: not_birak RPC'sinde "column reference slug is ambiguous" hatası.
-- Sebep: RETURNS TABLE kolon adları (slug, id...) fonksiyon içinde değişken sayılır;
-- stations sorgusundaki çıplak "slug" çift anlamlı kalıyordu. Kolonlar nitelendi.
-- Supabase SQL Editor'e yapıştır → Run. (30 saniye)

create or replace function not_birak(p_slug text, p_not text)
returns table (id bigint, slug text, not_text text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare temiz text;
begin
  if p_slug is null or not exists (select 1 from stations st where st.slug = p_slug and st.is_active) then
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
