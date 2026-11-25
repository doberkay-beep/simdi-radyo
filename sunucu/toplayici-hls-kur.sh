#!/bin/bash
# 25 Kas 2026: toplayıcıya HLS #EXTINF başlık okuyucu (Show/Viva kanalları). Yedek alır, kurar, yeniden başlatır.
set -e
K="-i $HOME/.ssh/gece-odasi"; S=root@188.245.2.113; D=$HOME/Desktop/simdi-radyo/collector/src
ssh $K $S 'cp /opt/simdi-collector/src/worker.mjs /opt/simdi-collector/src/worker.mjs.yedek-25kas'
scp -q $K "$D/hls.mjs" "$D/worker.mjs" $S:/opt/simdi-collector/src/
ssh $K $S 'cd /opt/simdi-collector && node --check src/worker.mjs && systemctl restart simdi-collector && sleep 4 && systemctl is-active simdi-collector'
echo "Kuruldu. Geri almak için: ssh $K $S 'cp /opt/simdi-collector/src/worker.mjs.yedek-25kas /opt/simdi-collector/src/worker.mjs && systemctl restart simdi-collector'"
