#!/bin/bash
# Senkron nöbetçisini kurar: /opt/simdi/senkron + systemd simdi-senkron.
# Önkoşul: dalga1.sql çalıştırılmış olmalı (senkron_anlari tablosu).
set -euo pipefail
mkdir -p /opt/simdi/senkron
cp /tmp/senkron/senkron.mjs /opt/simdi/senkron/senkron.mjs
ln -sfn /opt/simdi/radar/node_modules /opt/simdi/senkron/node_modules
cat > /etc/systemd/system/simdi-senkron.service <<'UNIT'
[Unit]
Description=SIMDI senkron nobetcisi - ayni sarki 3+ radyoda ayni anda
After=network-online.target
Wants=network-online.target
[Service]
WorkingDirectory=/opt/simdi/senkron
ExecStart=/usr/bin/node senkron.mjs
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now simdi-senkron
echo "── kuruldu. geçmiş taraması (~1 dk) bitince ilk anlar günlükte görünür:"
echo "   journalctl -u simdi-senkron -n 20"
