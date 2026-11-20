# "Sevdiğin şarkı çalıyor" — Hetzner kurulumu (nowby 1.1)

**Durum (20 Kas 2026):** CANLI. Anahtar ARLL69WH9Q (Team 8G5S22XSBZ) /opt/simdi/sevilen'de; servis gerçek kipte; ilk deneme bildirimi Berkay'ın iPhone'una gitti (APNs 200). Deneme: `node dene.mjs` (son görülen aboneye tek bildirim).

## 1. APNs anahtarı (Berkay, Apple Developer)
Certificates, Identifiers & Profiles → Keys → **+** → "Apple Push Notifications service (APNs)" → indir (`AuthKey_XXXX.p8`, yalnız bir kez inebilir).
Ayrıca Identifiers → `co.berkaydogan.nowby` → **Push Notifications** yetkisi açık olmalı (Xcode otomatik imzalamada kendisi açar).

## 2. Sunucu (188.245.2.113)
```bash
mkdir -p /opt/simdi/sevilen && cd /opt/simdi/sevilen
# sevilen.mjs + AuthKey_XXXX.p8 buraya; node_modules: pg (radar/nobetci ile aynı) → ln -s /opt/simdi/dunya-ani/node_modules .
cat > apns.env <<'E'
APNS_KEY_PATH=/opt/simdi/sevilen/AuthKey_XXXX.p8
APNS_KEY_ID=XXXX
APNS_TEAM_ID=YYYY
E
chmod 600 apns.env AuthKey_*.p8
psql "$ARSIV_PG_URL" -f tablo.sql
KURU=1 node sevilen.mjs   # önce kuru deneme: eşleşmeleri basar, göndermez
cp nowby-sevilen.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now nowby-sevilen
```

## 3. Caddy (api.nowby.co)
```
api.nowby.co {
	encode gzip
	handle /bildirim/* {
		reverse_proxy 127.0.0.1:3011
	}
	handle {
		reverse_proxy 127.0.0.1:3010
	}
}
```
`caddy reload`

## Yük
Supabase'e sıfır: abonelikler ve eşleştirme Hetzner arşivinde. Dakikada bir küçük sorgu (son 3 dk'nın çalışları) + abone başına günde en fazla 3 gönderim.
Uygulama ayarı kapatırsa `/bildirim/sil` jetonu siler; 90 gün görünmeyen jetonlar kendiliğinden silinir.
