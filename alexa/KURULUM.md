# nowby. Alexa becerisi — konsol kurulumu (Berkay için)

Kod `alexa` dalında: `web/app/api/alexa/route.ts`, `web/lib/alexa.ts`, `web/lib/alexa-dogrula.ts`. Modeller `alexa/model/`.
Uç nokta canlıda değil. Konsolda "test" için önce nowby.co'ya yayın gerekir (Berkay "yayına al" derse).

## Konsolda (developer.amazon.com/alexa/console/ask)

1. **Create Skill**
   - Ad: `nowby`
   - Ana dil: English (US)
   - Tür: **Music & Audio** değil, **Other → Custom model**
   - Barındırma: **Provision your own**
   - Şablon: **Start from Scratch**
2. **Build → Interfaces:** **Audio Player** açılır, Save.
3. **Build → Interaction Model → JSON Editor:** `alexa/model/en-US.json` içeriği yapıştırılır → Save → **Build skill**.
4. **Build → Endpoint**
   - Seçim: **HTTPS**
   - Default Region: `https://nowby.co/api/alexa`
   - Sertifika: "My development endpoint has a certificate from a trusted certificate authority"
   - Save.
5. **Diller:** sol üstteki dil menüsünden English (UK) ve German (DE) eklenir. Her birine kendi JSON'u (`en-GB.json`, `de-DE.json`) yapıştırılır, Build.
6. **Skill ID:** sol menüde "View Skill ID". Bu kimlik gizli değil. Bana verirsen Vercel'de (nowby projesi) `ALEXA_SKILL_ID` olarak girilir. Bu ayar değişikliğini senin onayınla yaparım; sonra uç nokta yalnız bu beceriye cevap verir.
7. **Test** sekmesi: "Development" seçilir, `open now by` yazılır ya da söylenir.

## Çağırma adı

"now by" (iki kelime). Tek kelimelik "nowby" yalnız marka sahibine izinli ve tanınması zayıf olabilir. Önce "now by" ile denenir.

## Radyo eklenince

`node alexa/model-uret.mjs` çalıştırılır, yeni JSON'lar konsola yapıştırılıp Build edilir.

## Sertifikasyondan önce

- nowby gizlilik metnine Alexa paragrafı. Alexa'dan kimlik, konum ya da ses kaydı alınmıyor; yalnız çalan radyonun adı Alexa'nın kendi alanında tutuluyor.
- Mağaza metni, örnek cümleler ve 108×108 / 512×512 simge.
- Radyolara bilgi notu (Berkay kararı).
