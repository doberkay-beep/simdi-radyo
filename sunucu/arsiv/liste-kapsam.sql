-- nowby. Listesi — uygulamanın "Hepsi" listesi için önbellek (20 Kas 2026). Hetzner arşivi (nowby veritabanı), postgres ile.
--
-- Sorun: uygulama (Apple 5.2.3) dünya listesini yalnız İZİNLİ radyolarla ister (sluglar = ~73 radyo). liste_ulke'nin
-- önbelleği yalnız sluglar NULL (bütün radyolar) için yazılıyor; izinli kümeyle haftalık liste her seferinde canlı
-- hesaplanıp okuma ucunun 15 sn sınırını aşıyordu → uygulamada "Liste yüklenemedi" (Mac'te Hepsi + Bu hafta).
--
-- Çözüm: adı konmuş slug kümeleri (liste_kapsam; 'izinli' satırını sevilen servisi api/now?uygulama=1'den 10 dk'da bir
-- tazeler) için pg_cron önbelleği. liste_ulke gelen kümeyi (sırasız) bir kapsamla eşleştirirse önbellekten döner.

CREATE TABLE IF NOT EXISTS public.liste_kapsam (
  ad text PRIMARY KEY,
  sluglar text[] NOT NULL,
  guncel timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.liste_kapsam_onbellek (
  ad text NOT NULL,
  gun_sayi integer NOT NULL,
  satirlar jsonb NOT NULL,
  guncel timestamptz NOT NULL,
  PRIMARY KEY (ad, gun_sayi)
);
GRANT SELECT ON public.liste_kapsam, public.liste_kapsam_onbellek TO PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.liste_kapsam TO toplayici;

CREATE OR REPLACE FUNCTION public.liste_kapsam_onbellek_yaz(p_ad text, p_gun integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' SET enable_nestloop TO off
AS $function$
declare v_sluglar text[];
begin
  select sluglar into v_sluglar from liste_kapsam where ad = p_ad;
  if v_sluglar is null or cardinality(v_sluglar) = 0 then return; end if;
  insert into liste_kapsam_onbellek (ad, gun_sayi, satirlar, guncel)
  select p_ad, p_gun, coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb), now()
  from liste_ulke_ham(now() - make_interval(days => p_gun), now(), v_sluglar, 50) l
  on conflict (ad, gun_sayi) do update set satirlar = excluded.satirlar, guncel = excluded.guncel;
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
  v_kapsam text;
begin
  if adet <= 50 and sona > now() - interval '10 minutes' then
    v_gun := case when abs(v_sure - 86400) < 1800 then 1
                  when abs(v_sure - 7 * 86400) < 3600 then 7 end;
    if v_gun is not null and sluglar is null then
      return query
        select x.artist, x.title, x.kez, x.istasyon
        from liste_ulke_onbellek o,
             jsonb_to_recordset(o.satirlar) as x(artist text, title text, kez bigint, istasyon bigint)
        where o.gun_sayi = v_gun
          and o.guncel > now() - case when v_gun = 1 then interval '2 hours' else interval '8 hours' end
        order by (x.istasyon >= 2) desc, x.kez desc, x.istasyon desc
        limit adet;
      if found then return; end if;
    elsif v_gun is not null then
      -- Adlı kapsam (ör. uygulamanın izinli radyoları): küme sırasız karşılaştırılır.
      select k.ad into v_kapsam from liste_kapsam k
      where (select array_agg(x order by x) from unnest(k.sluglar) x) = (select array_agg(x order by x) from unnest(sluglar) x)
      limit 1;
      if v_kapsam is not null then
        return query
          select x.artist, x.title, x.kez, x.istasyon
          from liste_kapsam_onbellek o,
               jsonb_to_recordset(o.satirlar) as x(artist text, title text, kez bigint, istasyon bigint)
          where o.ad = v_kapsam and o.gun_sayi = v_gun
            and o.guncel > now() - case when v_gun = 1 then interval '2 hours' else interval '8 hours' end
          order by (x.istasyon >= 2) desc, x.kez desc, x.istasyon desc
          limit adet;
        if found then return; end if;
      end if;
    end if;
  end if;
  return query select * from liste_ulke_ham(bastan, sona, sluglar, adet);
end;
$function$;
GRANT EXECUTE ON FUNCTION public.liste_ulke(timestamp with time zone, timestamp with time zone, text[], integer) TO PUBLIC;

-- Zamanlama (pg_cron, nowby veritabanı):
--   select cron.schedule('liste-kapsam-gun', '*/30 * * * *', $$set statement_timeout = '60s'; select liste_kapsam_onbellek_yaz('izinli', 1)$$);
--   select cron.schedule('liste-kapsam-hafta', '20 */3 * * *', $$set statement_timeout = '180s'; select liste_kapsam_onbellek_yaz('izinli', 7)$$);
