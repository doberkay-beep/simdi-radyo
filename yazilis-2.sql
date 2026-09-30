-- ŞİMDİ — guzel_yazilis düzeltmesi (1 Eki 2026)
-- Sorun: "HADİSE"/"MANİFEST"/"EYPİO" gibi tamamı büyük yazılışlar, büyük İ'nin
-- Türkçe harf bonusu yüzünden "Hadise"yi yeniyordu.
-- Yeni puan: Türkçe harf +3 · tamamı küçük −2 · tamamı BÜYÜK (5+ harf) −4 ·
-- bozuk kodlama −5. Kısa kısaltmalar (BLOK3, MFÖ) cezasız, sıklık belirler.
create or replace function guzel_yazilis(adaylar text[])
returns text
language sql immutable
as $$
  select v
  from unnest(adaylar) as v
  where coalesce(v, '') <> ''
  group by v
  order by
    ( (v ~ '[çğıöşüÇĞİÖŞÜ]')::int * 3
      - (v = lower(v) and v ~ '[a-zçğıöşü]')::int * 2
      - (v = upper(v) and length(regexp_replace(v, '[^A-Za-zÇĞİÖŞÜçğıöşü]', '', 'g')) >= 5)::int * 4
      - (v ~ '[ýþðÝÞÐ]')::int * 5
    ) desc,
    count(*) desc,
    v
  limit 1
$$;
