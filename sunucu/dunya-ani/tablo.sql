-- "Aynı anda" (27 Ekim 2026): farklı kıtalarda, birbirinden habersiz radyoların aynı dakikalarda
-- aynı şarkıyı çaldığı anlar. Hetzner arşivinde (nowby veritabanı). Nöbetçi: sunucu/dunya-ani/nobetci.mjs
CREATE TABLE IF NOT EXISTS public.dunya_anlari (
  id bigserial PRIMARY KEY,
  zaman timestamptz NOT NULL,          -- ilk radyonun başladığı an
  anahtar text NOT NULL,               -- katlanmış "sanatçı|şarkı"
  artist text NOT NULL,
  title text NOT NULL,
  ulkeler text[] NOT NULL,
  radyolar jsonb NOT NULL,             -- [{slug, ad, ulke, t}]
  bildirim timestamptz,                -- web push gönderildiyse
  olusturma timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dunya_anlari_zaman ON public.dunya_anlari (zaman DESC);
GRANT SELECT ON public.dunya_anlari TO PUBLIC;

-- İstasyon → ülke (nöbetçi nowby.co/api/now'dan 10 dakikada bir tazeler).
CREATE TABLE IF NOT EXISTS public.istasyon_ulke (slug text PRIMARY KEY, ulke text NOT NULL);
GRANT SELECT, INSERT, UPDATE ON public.dunya_anlari TO toplayici;
GRANT USAGE ON SEQUENCE public.dunya_anlari_id_seq TO toplayici;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.istasyon_ulke TO toplayici;

-- Site arşivi (nowby.co/ayni-anda) bunu okuma ucundan (uc.mjs, IZINLI) çağırır.
CREATE OR REPLACE FUNCTION public.dunya_anlari_liste(adet integer DEFAULT 60)
 RETURNS TABLE(id bigint, zaman timestamptz, artist text, title text, ulkeler text[], radyolar jsonb)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $$ select id, zaman, artist, title, ulkeler, radyolar from dunya_anlari order by zaman desc limit least(adet, 200) $$;
GRANT EXECUTE ON FUNCTION public.dunya_anlari_liste(integer) TO PUBLIC;
