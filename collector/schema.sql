-- ŞİMDİ — Faz 1 veritabanı şeması (Supabase / Postgres)
--
-- plays tablosu projenin KALBİDİR: yalnızca INSERT. UPDATE ve DELETE
-- veritabanı seviyesinde trigger ile engellenir — service_role anahtarı
-- RLS'i atlar ama trigger'ı atlayamaz, böylece arşiv koruması sağlamdır.
--
-- Supabase SQL Editor'de bir kez çalıştır.

-- ── stations ──────────────────────────────────────────────────────────
create table if not exists stations (
  id                bigint generated always as identity primary key,
  slug              text not null unique,
  name              text not null,
  city              text,
  frequency         text,
  stream_url        text not null,
  homepage          text,
  accent_color      text,
  band              text not null default 'tr' check (band in ('tr', 'int', 'own')),
  metadata_quality  text,          -- Faz 0'dan: good/static/junk/none/dead/hls
  is_active         boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now()
);

-- ── now_playing ── her istasyon için TEK satır, üzerine yazılır ────────
create table if not exists now_playing (
  station_id  bigint primary key references stations(id) on delete cascade,
  artist      text,
  title       text,
  raw_title   text,
  updated_at  timestamptz not null default now()
);

-- ── plays ── SADECE INSERT. Silme/güncelleme yok. ─────────────────────
create table if not exists plays (
  id          bigint generated always as identity primary key,
  station_id  bigint not null references stations(id) on delete cascade,
  artist      text,
  title       text,
  raw_title   text not null,
  started_at  timestamptz not null default now()
);

-- Sorgu desenleri: bir istasyonun geçmişi ve "o an ne çalıyordu" (arşiv).
create index if not exists plays_station_started_idx on plays (station_id, started_at desc);
create index if not exists plays_started_idx on plays (started_at desc);

-- ── plays salt-ekleme kilidi ──────────────────────────────────────────
-- UPDATE/DELETE denemesini hata fırlatarak reddeder. Arşiv asla bozulmaz.
create or replace function plays_salt_ekleme() returns trigger
  language plpgsql as $$
begin
  raise exception 'plays tablosu salt-eklemedir; % reddedildi', tg_op;
end;
$$;

drop trigger if exists plays_no_update_delete on plays;
create trigger plays_no_update_delete
  before update or delete on plays
  for each row execute function plays_salt_ekleme();

-- ── RLS ── Yazma yalnızca service_role (worker) ile. Okuma herkese açık.
-- Faz 2 okuma API'si anon anahtarıyla SELECT yapabilsin diye public read.
alter table stations   enable row level security;
alter table now_playing enable row level security;
alter table plays      enable row level security;

drop policy if exists stations_read   on stations;
drop policy if exists nowplaying_read on now_playing;
drop policy if exists plays_read      on plays;

create policy stations_read   on stations    for select using (true);
create policy nowplaying_read on now_playing for select using (true);
create policy plays_read      on plays       for select using (true);
-- INSERT/UPDATE/DELETE için policy YOK → anon/authenticated yazamaz.
-- Worker service_role anahtarı kullanır, RLS'i atlar (ama plays trigger'ı geçerli).
