-- nowby. 1.1 — Sunucudan yönetilen uygulama içeriği (kartlar, özel ekranlar, menü maddeleri, ayarlar).
-- Uygulama bunu doğrudan okumaz: nowby.co/api/uygulama (CDN 10 dk) okur → Supabase'e birkaç dakikada bir tek küçük sorgu.
-- Supabase SQL Editor'de bir kez çalıştır (Berkay'ın onayıyla).
--
-- Metin alanları ya düz yazı ("Merhaba") ya da dil sözlüğü ({"tr": "Merhaba", "en": "Hello"}) olabilir;
-- uç isteğin diline çevirir (yoksa en, o da yoksa tr).
--
-- tur = 'kart'  → ana sayfanın üstünde kart. veri: { baslik, metin, dugme, hedef, gorsel?, gerisayim?, renk?, simge?, kapatilabilir? }
-- tur = 'ekran' → nowby://ekran/<id> ile açılan özel ekran. veri: { baslik, bloklar: [ ... ] }
--                 blok türleri: {tur:"baslik",yazi} {tur:"metin",yazi} {tur:"gerisayim",an,yazi?} {tur:"gorsel",adres,oran?}
--                               {tur:"radyolar",baslik?,sluglar:[...]} {tur:"sarkilar",baslik?,kaynak:"/api/...",alan?:"satirlar"}
--                               {tur:"dugme",yazi,hedef}
-- tur = 'menu'  → menünün en üstünde madde. veri: { baslik, alt?, simge?, hedef }
-- tur = 'ayar'  → id = ayarın adı, veri = { deger: ... } (ör. id 'sairin', 'sonSurum', 'bildirim')
--
-- hedef: nowby://cal/<slug>, nowby://ekran/<id>, nowby://gece-yarisi, nowby://menu/<bolum> ya da https://… (uygulama içinde açılır).

create table if not exists uygulama_icerik (
  id text primary key,
  tur text not null check (tur in ('kart', 'ekran', 'menu', 'ayar')),
  yayinda boolean not null default true,
  baslangic timestamptz,          -- boşsa hemen
  bitis timestamptz,              -- boşsa süresiz
  diller text[],                  -- boşsa her dil (ör. '{tr}' yalnız Türkçe arayüz)
  platformlar text[],             -- boşsa hepsi: ios, mac, tv, watch
  en_dusuk_surum text,            -- ör. '1.1'; daha eski uygulamaya gitmez
  sira int not null default 0,    -- küçük olan önce
  veri jsonb not null default '{}'::jsonb,
  guncellendi timestamptz not null default now()
);

alter table uygulama_icerik enable row level security;
drop policy if exists "uygulama_icerik okunur" on uygulama_icerik;
create policy "uygulama_icerik okunur" on uygulama_icerik for select to anon, authenticated using (yayinda);

-- Başlangıç içeriği: bugüne kadar uygulamaya gömülü olan gece yarısı penceresi ve Şairin Frekansı.
insert into uygulama_icerik (id, tur, baslangic, bitis, sira, veri) values
  ('gece-yarisi-2027-menu', 'menu', '2026-11-15T00:00:00+03', '2027-02-01T00:00:00+03', 0, '{
     "baslik": {"tr": "Gece yarısı ne çalıyordu?", "en": "What was playing at midnight?"},
     "alt": {"tr": "Yılbaşında her radyoda 00:00''da çalan şarkı", "en": "The song on every radio at 00:00 on New Year''s Eve"},
     "simge": "sparkles", "hedef": "nowby://gece-yarisi"}'),
  ('gece-yarisi-2027-kart', 'kart', '2026-12-26T00:00:00+03', '2027-01-03T00:00:00+03', 0, '{
     "baslik": {"tr": "Gece yarısı ne çalıyordu?", "en": "What was playing at midnight?"},
     "metin": {"tr": "Yılbaşı gecesi her radyoda, yerel saatle tam 00:00''da çalan şarkı.", "en": "On New Year''s Eve, the song playing at exactly 00:00 local time on every radio."},
     "dugme": {"tr": "Aç", "en": "Open"}, "hedef": "nowby://gece-yarisi", "simge": "sparkles",
     "gerisayim": "2026-12-31T13:00:00Z", "kapatilabilir": true}'),
  ('sairin', 'ayar', null, null, 0, '{"deger": ["borusan-klasik", "itu-klasik", "radio-swiss-classic", "radyo-eksen", "joyturk-rock",
     "radyo-odtu-rock", "turk-rock-fm", "max-fm", "apacik-radyo", "kexp", "radio-paradise-rock"]}'),
  ('sonSurum', 'ayar', null, null, 0, '{"deger": "1.1"}')
on conflict (id) do nothing;
