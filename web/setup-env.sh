#!/usr/bin/env bash
# ŞİMDİ web — .env.local'i doğru değerlerle yazar.
# Kopyala-yapıştır sorunlarını atlatmak için anahtar burada hazır.
# Anahtar PUBLIC (anon) — yalnızca okuma yapar, RLS ile korunur, güvenli.
# (Gizli olan service_role/secret anahtarı buraya ASLA konmaz.)
# Çalıştır:  bash web/setup-env.sh
set -e
cd "$(dirname "$0")"

cat > .env.local <<'EOF'
SUPABASE_URL=https://uiouzizblrkojmsqvbjk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM
EOF

echo "✓ .env.local yazıldı:"
cat .env.local
