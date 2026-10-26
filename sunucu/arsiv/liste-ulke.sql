-- nowby. LİSTESİ, ülke ülke (26 Eki 2026). Hetzner arşivinde (nowby veritabanı) çalışır.
-- Türkiye listesi eskisi gibi liste_araligi'den gelir; bu fonksiyon diğer ülkeler içindir.
--
-- Ülkelerde 13-25 radyo olduğu için Türkiye'deki "en az 2 radyo" şartı tek başına yetmez:
--   * Bir radyonun bir şarkıya katkısı günde en fazla 3 çalma sayılır (otomasyon döngüsü listeyi ele geçirmesin).
--   * Bağış/tanıtım metinleri elenir ("Commercial-free", "Listener-supported", "Begathon"…).
--   * Önce en az 2 radyoda çalanlar; liste adet'e ulaşmazsa tek radyoda çalanlarla tamamlanır.
-- sluglar: web/lib/ulke-veri.json'dan o ülkenin istasyonları (istemci gönderir; veritabanında ülke sütunu yok); null ise bütün radyolar.

DROP FUNCTION IF EXISTS public.liste_ulke(timestamp with time zone, timestamp with time zone, text[], integer);
CREATE OR REPLACE FUNCTION public.liste_ulke_ham(bastan timestamp with time zone, sona timestamp with time zone,
                                             sluglar text[] DEFAULT NULL, adet integer DEFAULT 50)
 RETURNS TABLE(artist text, title text, kez bigint, istasyon bigint)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  with ham as materialized (
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
      and strpos(lower(s.name), lower(p.title)) = 0   -- başlık alanına istasyon adını yazanlar ("Bossa Jazz Brasil")
      and strpos(lower(p.artist), lower(s.name)) = 0
      and p.artist !~* '(https?:|www\.|\.(com|net|org|de|fr|nl|it|es|co|uk|jp|br)\M|use http|<)'
      and p.title  !~* '(https?:|www\.|\.com|\.net|use http|<|now playing)'
      and p.title  !~ '~' and p.artist !~ '~'
      and (p.artist || ' ' || p.title) !~* '(commercial-free|listener-supported|keep us on the air|begathon|donate|werbung|publicit|nachrichten|verkehr|jingle|programa|chamada|vinheta|desconhecid|unknown artist|faixa [0-9]|track [0-9])'
      and p.artist !~* '\mr[aá]dio\M'  -- sanatçı alanında "MGT RÁDIO" gibi istasyon adları
  ),
  -- Program adı süzgeci: aynı istasyonda aynı başlık 3+ farklı "sanatçı" ile geçiyorsa (ör. "VH MPB", "VH Jamaica"
  -- hepsi "Bossa Jazz Brasil") o bir şarkı değil, program/kuşak adıdır.
  program as materialized (
    select station_id, t from ham group by station_id, t having count(distinct a) >= 3
  ),
  gunluk as (
    select h.a, h.t, h.station_id, h.gun, least(count(*), 3) as n,
           min(h.artist) as ornek_artist, min(h.title) as ornek_title
    from ham h left join program g using (station_id, t)
    where g.station_id is null
    group by h.a, h.t, h.station_id, h.gun
  ),
  -- Adlar gunluk'teki örneklerden seçilir; ham'a geri birleşmek 100 bin satırda planı çökertiyordu.
  sarki as (
    select guzel_yazilis(array_agg(ornek_artist)) as artist, guzel_yazilis(array_agg(ornek_title)) as title,
           sum(n)::bigint as kez, count(distinct station_id)::bigint as istasyon
    from gunluk group by a, t
  )
  select artist, title, kez, istasyon from sarki
  order by (istasyon >= 2) desc, kez desc, istasyon desc
  limit adet;
$function$;

GRANT EXECUTE ON FUNCTION public.liste_ulke_ham(timestamp with time zone, timestamp with time zone, text[], integer) TO PUBLIC;

-- Dünya listesi (sluglar null) 100 bin+ satır tarar: günlük ~4 sn, haftalık ~20 sn. Okuma ucunun 8-15 sn sınırına
-- sığmadığı için pg_cron önbelleğe yazar (Türkiye'deki liste_onbellek ile aynı düzen). Ülke listeleri canlı kalır.
CREATE TABLE IF NOT EXISTS public.liste_ulke_onbellek (
  gun_sayi integer PRIMARY KEY,
  satirlar jsonb NOT NULL,
  guncel timestamptz NOT NULL
);
GRANT SELECT ON public.liste_ulke_onbellek TO PUBLIC;

-- enable_nestloop yalnız burada kapalı: bütün dünya taramasında hash join ~20 sn, iç içe döngüyle ~110 sn.
-- Ülke sorgularında (az istasyon) tersi geçerli: istasyon indeksiyle iç içe döngü 1-2 sn, bu yüzden liste_ulke_ham'da açık.
CREATE OR REPLACE FUNCTION public.liste_ulke_onbellek_yaz(p_gun integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' SET enable_nestloop TO off
AS $function$
begin
  insert into liste_ulke_onbellek (gun_sayi, satirlar, guncel)
  select p_gun, coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb), now()
  from liste_ulke_ham(now() - make_interval(days => p_gun), now(), null, 50) l
  on conflict (gun_sayi) do update set satirlar = excluded.satirlar, guncel = excluded.guncel;
end;
$function$;

CREATE OR REPLACE FUNCTION public.liste_ulke(bastan timestamp with time zone, sona timestamp with time zone,
                                             sluglar text[] DEFAULT NULL, adet integer DEFAULT 50)
 RETURNS TABLE(artist text, title text, kez bigint, istasyon bigint)
 LANGUAGE plpgsql STABLE SET search_path TO 'public'
AS $function$
declare
  v_gun int;
  v_sure double precision := extract(epoch from (sona - bastan));
begin
  if sluglar is null and adet <= 50 and sona > now() - interval '10 minutes' then
    v_gun := case when abs(v_sure - 86400) < 1800 then 1
                  when abs(v_sure - 7 * 86400) < 3600 then 7 end;
    if v_gun is not null then
      return query
        select x.artist, x.title, x.kez, x.istasyon
        from liste_ulke_onbellek o,
             jsonb_to_recordset(o.satirlar) as x(artist text, title text, kez bigint, istasyon bigint)
        where o.gun_sayi = v_gun
          and o.guncel > now() - case when v_gun = 1 then interval '2 hours' else interval '8 hours' end
        order by (x.istasyon >= 2) desc, x.kez desc, x.istasyon desc
        limit adet;
      if found then return; end if;
    end if;
  end if;
  return query select * from liste_ulke_ham(bastan, sona, sluglar, adet);
end;
$function$;
GRANT EXECUTE ON FUNCTION public.liste_ulke(timestamp with time zone, timestamp with time zone, text[], integer) TO PUBLIC;

-- Zamanlama (pg_cron, nowby veritabanı):
--   select cron.schedule('liste-ulke-gun', '*/30 * * * *', $$set statement_timeout = '60s'; select liste_ulke_onbellek_yaz(1)$$);
--   select cron.schedule('liste-ulke-hafta', '12 */3 * * *', $$set statement_timeout = '180s'; select liste_ulke_onbellek_yaz(7)$$);
