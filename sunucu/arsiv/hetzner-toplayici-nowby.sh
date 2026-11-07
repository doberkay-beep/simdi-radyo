#!/usr/bin/env bash
# Toplayıcıda iki düzeltme (7 Kas, Radio Armisa'nın sorusu üzerine):
#   1. Yayınlara kendini "nowby/1.0 (+https://nowby.co)" diye tanıtır ("Simdi/0.1" yerine).
#   2. AzuraCast kullanan radyolarda yayına 10 sn'de bir bağlanmak yerine herkese açık
#      /api/nowplaying ucunu dakikada bir okur. Uç çalışmazsa o radyo eskisi gibi ICY ile sürer.
# Veritabanına dokunmaz. Sorun çıkarsa eski dosyalar otomatik geri konur.
set -euo pipefail

SUNUCU="root@188.245.2.113"
ANAHTAR="$HOME/.ssh/gece-odasi"
KLASOR="$(cd "$(dirname "$0")" && pwd)"
KAYNAK="$KLASOR/../../collector/src"
UZAK="/opt/simdi-collector"
YEDEK="$UZAK/yedek-7kas"
ssh_() { ssh -i "$ANAHTAR" -o BatchMode=yes "$SUNUCU" "$@"; }
scp_() { scp -q -i "$ANAHTAR" -o BatchMode=yes "$@"; }

for f in "$KAYNAK/worker.mjs" "$KAYNAK/icy.mjs"; do
  [ -s "$f" ] || { echo "Eksik dosya: $f. Hiçbir şey değişmedi."; exit 1; }
done
grep -q 'azuraTur' "$KAYNAK/worker.mjs" || { echo "worker.mjs yeni sürüm değil. Hiçbir şey değişmedi."; exit 1; }
grep -q 'nowby/1.0' "$KAYNAK/icy.mjs" || { echo "icy.mjs yeni sürüm değil. Hiçbir şey değişmedi."; exit 1; }

echo "Bu betik toplayıcı sunucusunda şunları yapar:"
echo "  1. Mevcut worker.mjs ve icy.mjs dosyalarını yedekler ($YEDEK)"
echo "  2. Yeni sürümleri yükler ve söz dizimini denetler"
echo "  3. Toplayıcıyı yeniden başlatır, 2,5 dakika izler"
echo "  4. Servis durur ya da yeni şarkı kaydı gelmezse eski dosyaları geri koyar"
echo

ssh_ "mkdir -p $YEDEK && cp -n $UZAK/src/worker.mjs $UZAK/src/icy.mjs $YEDEK/"
scp_ "$KAYNAK/worker.mjs" "$KAYNAK/icy.mjs" "$SUNUCU:/tmp/"
ssh_ "node --check /tmp/worker.mjs && node --check /tmp/icy.mjs && cp /tmp/worker.mjs /tmp/icy.mjs $UZAK/src/ && systemctl restart simdi-collector"
echo "Yeniden başlatıldı, izleniyor (150 sn)..."
BASLA="$(ssh_ "date -u '+%Y-%m-%d %H:%M:%S'")"
sleep 150

DURUM="$(ssh_ "systemctl is-active simdi-collector" || true)"
KAYITLAR="$(ssh_ "journalctl -u simdi-collector --since '$BASLA UTC' --no-pager -o cat")"
SARKI="$(printf '%s\n' "$KAYITLAR" | grep -c '♪' || true)"
HATA="$(printf '%s\n' "$KAYITLAR" | grep -c '^.*! ' || true)"

if [ "$DURUM" != "active" ] || [ "$SARKI" -lt 20 ]; then
  echo "SORUN: servis=$DURUM, yeni şarkı=$SARKI. Eski dosyalar geri konuyor."
  ssh_ "cp $YEDEK/worker.mjs $YEDEK/icy.mjs $UZAK/src/ && systemctl restart simdi-collector"
  sleep 15
  echo "Geri alındı. Servis: $(ssh_ 'systemctl is-active simdi-collector' || true)"
  exit 1
fi

echo
echo "Sonuç: servis $DURUM, 150 sn'de $SARKI yeni şarkı, $HATA hata satırı."
echo "AzuraCast durumu:"
printf '%s\n' "$KAYITLAR" | grep -E 'AzuraCast' | sed -E 's/^[^ ]+ //' | sort -u || true
echo
echo "Tamam. Geri almak gerekirse: $YEDEK içindeki iki dosyayı src/ altına kopyalayıp servisi yeniden başlat."
