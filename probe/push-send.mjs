// ŞİMDİ — Push gönderici. Kayıtlı cihazlara "yükselen şarkı / eşzamanlı"
// bildirimi yollar. GitHub Actions'ın açık ağında koşar (Expo push API).
// Girdi (env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.log("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik.");
  process.exit(0);
}

// 1) Bildirim metnini belirle — canlı nabızdan (herkese açık API).
let baslik = "ŞİMDİ";
let govde = "";
try {
  const r = await fetch("https://necaliyor.co/api/nabiz", { headers: { "User-Agent": "simdi-push/1.0" } });
  const d = await r.json();
  const sim = d.simultaneous?.[0];
  const tr = d.trend?.[0];
  if (sim) {
    const parca = sim.artist && sim.artist !== sim.title ? `${sim.artist} — ${sim.title}` : sim.title;
    baslik = `Şu an ${sim.stations.length} istasyonda`;
    govde = parca;
  } else if (tr) {
    const parca = tr.artist && tr.artist !== tr.title ? `${tr.artist} — ${tr.title}` : tr.title;
    baslik = "Yükselen ↑";
    govde = parca;
  }
} catch {
  // metin yoksa çık
}
if (!govde) {
  console.log("Gönderilecek dikkat çekici bir şey yok; çıkılıyor.");
  process.exit(0);
}

// 2) Kayıtlı jetonları oku (service_role).
async function tokenlar() {
  const r = await fetch(`${URL_}/rest/v1/push_tokens?select=token`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) return [];
  const d = await r.json();
  return Array.isArray(d) ? d.map((x) => x.token).filter(Boolean) : [];
}

const tokens = await tokenlar();
if (!tokens.length) {
  console.log("Kayıtlı cihaz yok.");
  process.exit(0);
}
console.log(`${tokens.length} cihaza gönderiliyor: ${baslik} — ${govde}`);

// 3) Expo push API'ye yolla (100'lük gruplar).
async function gonder(batch) {
  const mesajlar = batch.map((to) => ({
    to,
    title: baslik,
    body: govde,
    sound: "default",
    data: { tur: "nabiz" },
  }));
  const r = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(mesajlar),
  });
  const d = await r.json().catch(() => ({}));
  console.log("yanıt:", JSON.stringify(d).slice(0, 300));
}

for (let i = 0; i < tokens.length; i += 100) {
  await gonder(tokens.slice(i, i + 100));
}
console.log("bitti.");
