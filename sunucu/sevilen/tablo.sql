-- nowby 1.1 — "Sevdiğin şarkı çalıyor" bildirimi. HETZNER arşiv veritabanında (Supabase DEĞİL: Disk IO geçmişi).
-- Kurulum: psql "$ARSIV_PG_URL" -f tablo.sql  (Berkay'ın onayıyla)

create table if not exists bildirim_abone (
  token text primary key,                 -- APNs cihaz jetonu (kimliksiz; hesap yok)
  ortam text not null default 'production' check (ortam in ('production', 'sandbox')),
  dil text not null default 'tr',
  saat_dilimi text not null default 'Europe/Istanbul',
  sanatcilar text[] not null default '{}', -- katlanmış (küçük harf, işaretsiz) sanatçı adları
  sarkilar text[] not null default '{}',   -- katlanmış "sanatçı|şarkı" anahtarları
  olusturma timestamptz not null default now(),
  son_gorulme timestamptz not null default now()
);

create table if not exists bildirim_gonderilen (
  token text not null references bildirim_abone(token) on delete cascade,
  anahtar text not null,                  -- "s:<sanatçı|şarkı>" ya da "a:<sanatçı>"
  zaman timestamptz not null default now()
);
create index if not exists bildirim_gonderilen_token_zaman on bildirim_gonderilen (token, zaman desc);

-- 90 gün görünmeyen aboneler ve 3 günden eski gönderim kayıtları servis tarafından günde bir silinir.
