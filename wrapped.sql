-- ŞİMDİ — Wrapped temeli: anonim dinleme günlüğü.
-- Supabase SQL Editor'de BİR KEZ çalıştır.
--
-- Her "çal" dokunuşu bir satır: kim (anonim cihaz kimliği), hangi istasyon, ne
-- zaman. Aralık'ta "Senin 2026'n" kartları bu tablodan doğar. Kimlik tamamen
-- anonimdir (rastgele yerel id); kişisel veri tutulmaz.

create table if not exists dinlemeler (
  id bigint generated always as identity primary key,
  dinleyici text not null,     -- anonim cihaz kimliği (localStorage)
  slug text not null,          -- istasyon
  t timestamptz not null default now()
);
create index if not exists dinlemeler_kisi_idx on dinlemeler (dinleyici, t desc);
create index if not exists dinlemeler_t_idx on dinlemeler (t desc);

alter table dinlemeler enable row level security;
-- Anon doğrudan okuyamaz/yazamaz; yalnız RPC + service_role.

-- Dinleme kaydet — dakikada aynı kişi+istasyon için tek satır (spam kalkanı).
create or replace function dinleme_kaydet(p_dinleyici text, p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_dinleyici is null or length(p_dinleyici) not between 6 and 40 then return; end if;
  if p_slug is null or length(p_slug) not between 2 and 80 then return; end if;
  if exists (
    select 1 from dinlemeler
    where dinleyici = p_dinleyici and slug = p_slug and t > now() - interval '60 seconds'
  ) then return; end if;
  insert into dinlemeler (dinleyici, slug) values (p_dinleyici, p_slug);
end $$;
grant execute on function dinleme_kaydet(text, text) to anon, authenticated;
