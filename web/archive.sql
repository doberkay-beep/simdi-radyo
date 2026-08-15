-- ŞİMDİ — Faz 2 arşiv fonksiyonu.
-- /api/archive bunu çağırır. Supabase SQL Editor'de bir kez çalıştır.
--
-- Verilen ana (ts) kadar, her istasyon için o anda çalan (o an ≤ started_at
-- olan en son) parçayı döner.

create or replace function archive_at(ts timestamptz)
returns table (
  station_id   bigint,
  slug         text,
  name         text,
  accent_color text,
  artist       text,
  title        text,
  raw_title    text,
  started_at   timestamptz
) language sql stable as $$
  select distinct on (s.id)
    s.id, s.slug, s.name, s.accent_color,
    p.artist, p.title, p.raw_title, p.started_at
  from stations s
  join plays p on p.station_id = s.id
  where p.started_at <= ts
    and s.is_active = true
  order by s.id, p.started_at desc;
$$;

-- Okuma API'si anon anahtarla çağırır; çalıştırma izni ver.
grant execute on function archive_at(timestamptz) to anon, authenticated;
