-- ŞİMDİ — Sanatçı Radarı Push (web push abonelikleri).
-- Supabase SQL Editor'de BİR KEZ çalıştır.
--
-- Akış: tarayıcı bildirim izni verir → aboneliğini + izlediği sanatçıları
-- radar_esitle RPC'siyle yazar → sunucudaki radar nöbetçisi (service_role)
-- her yeni çalınan parçayı bu kayıtlarla eşleştirip web push gönderir.

create table if not exists radar_kayit (
  id bigint generated always as identity primary key,
  endpoint text not null,          -- push aboneliğinin benzersiz adresi
  abone jsonb not null,            -- tam PushSubscription (endpoint + keys)
  sanatci text not null,           -- izlenen sanatçı (görünen yazım)
  created_at timestamptz not null default now(),
  son_bildirim timestamptz         -- bu kayda en son ne zaman bildirim gitti
);
create unique index if not exists radar_kayit_tekil
  on radar_kayit (endpoint, lower(sanatci));
create index if not exists radar_kayit_sanatci on radar_kayit (lower(sanatci));

alter table radar_kayit enable row level security;
-- Anon doğrudan okuyamaz/yazamaz; yalnız aşağıdaki RPC'ler + service_role.

-- Aboneliğin sanatçı listesini TEK seferde eşitle (sil + yaz).
-- Boş liste = abonelikten tamamen çık.
create or replace function radar_esitle(p_abone jsonb, p_sanatcilar text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_endpoint text := p_abone->>'endpoint';
  s text;
begin
  if v_endpoint is null or length(v_endpoint) < 20 or length(v_endpoint) > 1000 then
    raise exception 'gecersiz abonelik';
  end if;
  if coalesce(array_length(p_sanatcilar, 1), 0) > 50 then
    raise exception 'en fazla 50 sanatci';
  end if;
  delete from radar_kayit where endpoint = v_endpoint;
  foreach s in array coalesce(p_sanatcilar, '{}') loop
    s := trim(s);
    if length(s) between 1 and 80 then
      insert into radar_kayit (endpoint, abone, sanatci)
      values (v_endpoint, p_abone, s)
      on conflict do nothing;
    end if;
  end loop;
end $$;
grant execute on function radar_esitle(jsonb, text[]) to anon, authenticated;
