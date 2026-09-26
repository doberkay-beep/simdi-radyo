-- berkaydogan.co — Okur Mektupları (siteye kısa mesaj bırakma köşesi).
-- Supabase SQL Editor'de bir kez çalıştır. Moderasyonlu: mektuplar onaylanana
-- dek görünmez; onaylamak için: update okur_mektuplari set onaylandi = true where id = <id>;

create table if not exists okur_mektuplari (
  id bigint generated always as identity primary key,
  ad text,
  mesaj text not null,
  created_at timestamptz not null default now(),
  onaylandi boolean not null default false
);

create index if not exists okur_mektuplari_onay_idx on okur_mektuplari (onaylandi, created_at desc);

alter table okur_mektuplari enable row level security;

drop policy if exists "onaylilar okunur" on okur_mektuplari;
create policy "onaylilar okunur" on okur_mektuplari
  for select to anon, authenticated using (onaylandi = true);

create or replace function mektup_birak(p_ad text, p_mesaj text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare temiz_mesaj text;
declare temiz_ad text;
begin
  temiz_mesaj := btrim(coalesce(p_mesaj, ''));
  temiz_ad := nullif(btrim(coalesce(p_ad, '')), '');
  if length(temiz_mesaj) < 2 or length(temiz_mesaj) > 280 then
    raise exception 'mesaj 2-280 karakter olmalı';
  end if;
  if temiz_ad is not null and length(temiz_ad) > 40 then
    raise exception 'ad en çok 40 karakter';
  end if;
  if temiz_mesaj ~* '(https?://|www\.|://)' or coalesce(temiz_ad, '') ~* '(https?://|www\.|://)' then
    raise exception 'link kabul edilmiyor';
  end if;
  insert into okur_mektuplari (ad, mesaj) values (temiz_ad, temiz_mesaj);
end $$;

grant execute on function mektup_birak(text, text) to anon, authenticated;

-- Bekleyenleri görmek için (sen, SQL Editor'den):
--   select id, ad, mesaj, created_at from okur_mektuplari where not onaylandi order by created_at desc;
