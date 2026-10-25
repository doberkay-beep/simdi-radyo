-- nowby. LİSTESİ, ülke ülke (26 Eki 2026). Hetzner arşivinde (nowby veritabanı) çalışır.
-- Türkiye listesi eskisi gibi liste_araligi'den gelir; bu fonksiyon diğer ülkeler içindir.
--
-- Ülkelerde 13-25 radyo olduğu için Türkiye'deki "en az 2 radyo" şartı tek başına yetmez:
--   * Bir radyonun bir şarkıya katkısı günde en fazla 3 çalma sayılır (otomasyon döngüsü listeyi ele geçirmesin).
--   * Bağış/tanıtım metinleri elenir ("Commercial-free", "Listener-supported", "Begathon"…).
--   * Önce en az 2 radyoda çalanlar; liste adet'e ulaşmazsa tek radyoda çalanlarla tamamlanır.
-- sluglar: web/lib/ulke-veri.json'dan o ülkenin istasyonları (istemci gönderir; veritabanında ülke sütunu yok); null ise bütün radyolar.

DROP FUNCTION IF EXISTS public.liste_ulke(timestamp with time zone, timestamp with time zone, text[], integer);
CREATE OR REPLACE FUNCTION public.liste_ulke(bastan timestamp with time zone, sona timestamp with time zone,
                                             sluglar text[] DEFAULT NULL, adet integer DEFAULT 50)
 RETURNS TABLE(artist text, title text, kez bigint, istasyon bigint)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  with ham as (
    select p.station_id, p.artist, p.title,
           sarki_slug(p.artist) as a, sarki_slug(p.title) as t,
           ((p.started_at + interval '3 hours')::date) as gun
    from plays p
    join stations s on s.id = p.station_id and s.is_active
    where p.started_at >= bastan and p.started_at < sona
      and (sluglar is null or s.slug = any(sluglar))  -- null: bütün dünya ("Hepsi")
      and coalesce(p.artist, '') <> '' and coalesce(p.title, '') <> ''
      and lower(p.artist) <> lower(p.title)
      and lower(p.artist) <> lower(s.name)
      and strpos(lower(s.name), lower(p.artist)) = 0  -- "Deutschlandfunk" / "Deutschlandfunk (DLF)" gibi istasyon kimlikleri
      and p.artist !~* '(https?:|www\.|\.(com|net|org|de|fr|nl|it|es|co|uk|jp|br)\M|use http|<)'
      and p.title  !~* '(https?:|www\.|\.com|\.net|use http|<|now playing)'
      and p.title  !~ '~' and p.artist !~ '~'
      and (p.artist || ' ' || p.title) !~* '(commercial-free|listener-supported|keep us on the air|begathon|donate|werbung|publicit|nachrichten|verkehr|jingle)'
  ),
  gunluk as (
    select a, t, station_id, gun, least(count(*), 3) as n
    from ham group by a, t, station_id, gun
  ),
  sayim as (
    select a, t, sum(n)::bigint as kez, count(distinct station_id)::bigint as istasyon
    from gunluk group by a, t
  ),
  sarki as (
    select guzel_yazilis(array_agg(h.artist)) as artist, guzel_yazilis(array_agg(h.title)) as title,
           min(c.kez) as kez, min(c.istasyon) as istasyon
    from sayim c join ham h using (a, t)
    group by c.a, c.t
  )
  select artist, title, kez, istasyon from sarki
  order by (istasyon >= 2) desc, kez desc, istasyon desc
  limit adet;
$function$;

GRANT EXECUTE ON FUNCTION public.liste_ulke(timestamp with time zone, timestamp with time zone, text[], integer) TO PUBLIC;
