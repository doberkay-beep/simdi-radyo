-- ŞİMDİ — Anonim kalp (istasyona ❤ gönder).
-- Supabase SQL Editor'de bir kez çalıştır. Metin tutulmaz; yalnızca sayaç.

create table if not exists station_hearts (
  slug text primary key,
  toplam bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- Okuma herkese açık; yazma yalnızca aşağıdaki RPC üzerinden (güvenli).
alter table station_hearts enable row level security;

drop policy if exists "hearts okunur" on station_hearts;
create policy "hearts okunur" on station_hearts
  for select to anon, authenticated using (true);

-- Bir kalp ekle → yeni toplamı döndür. Yalnızca var olan aktif istasyonlar.
create or replace function kalp_gonder(p_slug text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare y bigint;
begin
  if p_slug is null or length(p_slug) < 1 or length(p_slug) > 64 then
    raise exception 'gecersiz slug';
  end if;
  if not exists (select 1 from stations where slug = p_slug and is_active) then
    raise exception 'istasyon yok';
  end if;
  insert into station_hearts (slug, toplam) values (p_slug, 1)
  on conflict (slug) do update
    set toplam = station_hearts.toplam + 1, updated_at = now()
  returning toplam into y;
  return y;
end $$;

grant execute on function kalp_gonder(text) to anon, authenticated;
