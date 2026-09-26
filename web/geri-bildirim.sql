-- ŞİMDİ — Topluluk geri bildirimi: "yanlış şarkı yazıyor" + yeni istasyon önerileri.
-- Supabase SQL Editor'de bir kez çalıştır. Kayıtlar herkese kapalıdır;
-- yalnız sen SQL'den okursun:
--   select * from geri_bildirim order by created_at desc limit 50;

create table if not exists geri_bildirim (
  id bigint generated always as identity primary key,
  tur text not null check (tur in ('yanlis-sarki', 'istasyon-oner')),
  slug text,
  mesaj text not null,
  created_at timestamptz not null default now()
);

alter table geri_bildirim enable row level security;
-- select politikası bilerek YOK: anon okuyamaz. Yazma yalnız RPC ile.

create or replace function geri_bildirim_birak(p_tur text, p_slug text, p_mesaj text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare temiz text;
begin
  if p_tur not in ('yanlis-sarki', 'istasyon-oner') then
    raise exception 'geçersiz tür';
  end if;
  temiz := btrim(coalesce(p_mesaj, ''));
  if length(temiz) < 2 or length(temiz) > 300 then
    raise exception 'mesaj 2-300 karakter olmalı';
  end if;
  insert into geri_bildirim (tur, slug, mesaj)
  values (p_tur, nullif(btrim(coalesce(p_slug, '')), ''), temiz);
end $$;

grant execute on function geri_bildirim_birak(text, text, text) to anon, authenticated;
