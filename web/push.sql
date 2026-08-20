-- ŞİMDİ — Push bildirim jetonları (mobil uygulama).
-- Supabase SQL Editor'de bir kez çalıştır.

create table if not exists push_tokens (
  token text primary key,
  platform text,
  favoriler text[] default '{}',
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table push_tokens enable row level security;
-- Anon okuyamaz/yazamaz; yalnızca RPC ile kaydedilir, gönderim service_role ile.

-- Uygulamadan jeton kaydet/güncelle (favori sanatçı/istasyon listesiyle).
create or replace function push_kaydet(p_token text, p_platform text, p_favoriler text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or length(p_token) < 8 or length(p_token) > 256 then
    raise exception 'gecersiz jeton';
  end if;
  insert into push_tokens (token, platform, favoriler, last_seen)
  values (p_token, coalesce(p_platform, 'bilinmiyor'), coalesce(p_favoriler, '{}'), now())
  on conflict (token) do update
    set platform = excluded.platform,
        favoriler = excluded.favoriler,
        last_seen = now();
end $$;

grant execute on function push_kaydet(text, text, text[]) to anon, authenticated;
