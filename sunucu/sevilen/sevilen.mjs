// nowby 1.1 — "Sevdiğin şarkı çalıyor" nöbetçisi (Hetzner, 7/24). HENÜZ CANLIDA DEĞİL: kurulum Berkay'ın onayıyla.
//
// iPhone uygulaması (yalnız kullanıcı açarsa) APNs jetonunu, izlediği sanatçıları ve Av Defteri'ndeki şarkıları
// api.nowby.co/bildirim/kayit'e yollar. Bu servis Hetzner arşivini 60 sn'de bir okur (son başlayan şarkılar) ve
// eşleşmede APNs ile bildirim gönderir. Supabase'e HİÇ dokunmaz (Disk IO geçmişi): abonelikler de burada.
//
// Sınırlar: kişi başı günde en fazla 3 bildirim; aynı şarkı 12 saatte, aynı sanatçı 3 saatte bir;
// cihaz saatiyle 23:00–09:00 sessiz; yalnız uygulamada izinli radyolar (api/now?uygulama=1).
//
// Ortam: /opt/simdi-collector/.env.local içinde ARSIV_PG_URL; ayrıca
//   APNS_KEY_PATH=/opt/simdi/sevilen/AuthKey_XXXX.p8  APNS_KEY_ID=XXXX  APNS_TEAM_ID=YYYY
// Deneme: KURU=1 node sevilen.mjs → gönderim yapmaz, yalnız eşleşmeleri basar.

import http from "node:http";
import http2 from "node:http2";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";

const env = {
  ...Object.fromEntries(
    readFileSync("/opt/simdi-collector/.env.local", "utf8").split("\n").filter((s) => s.includes("="))
      .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1).trim()]),
  ),
  ...process.env,
};
const PORT = Number(env.SEVILEN_PORT) || 3011;
const KURU = env.KURU === "1";
const ARALIK = 60_000, GERI = 3 * 60_000;
const GUNLUK = 3, SARKI_ARA = 12 * 3600_000, SANATCI_ARA = 3 * 3600_000;
const SESSIZ_BAS = 23, SESSIZ_BIT = 9;
const KONU = "co.berkaydogan.nowby";

const db = new pg.Pool({ connectionString: env.ARSIV_PG_URL, max: 3, idleTimeoutMillis: 30_000 });
const log = (...a) => console.log(new Date().toISOString(), ...a);

// Nöbetçiyle (dunya-ani) ve uygulamayla aynı katlama: küçük harf, işaretsiz, harf/rakam dışı boşluk.
const katla = (s) => String(s || "").toLocaleLowerCase("tr").normalize("NFKD").replace(/\p{M}/gu, "")
  .replace(/ı/g, "i").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const COP = /(https?:|www\.|\.(com|de|fr|es|it|net)\b|<|jingle|news|nachrichten|advert|werbung|reklam|haber|programa|unknown|verbraucherinformation|now playing)/i;

// ---------------------------------------------------------------- kayıt ucu
const istek = new Map(); // ip → [zamanlar]
function sinirli(ip) {
  const s = Date.now(), l = (istek.get(ip) || []).filter((t) => s - t < 60_000);
  l.push(s); istek.set(ip, l);
  return l.length > 20;
}
function cevap(res, kod, govde) {
  res.writeHead(kod, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(govde ?? {}));
}
const jetonGecerli = (t) => typeof t === "string" && /^[0-9a-f]{64,200}$/i.test(t);

const sunucu = http.createServer(async (req, res) => {
  if (req.url === "/bildirim/saglik") return cevap(res, 200, { ok: true });
  if (req.method !== "POST") return cevap(res, 405, { hata: "yöntem" });
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (sinirli(ip)) return cevap(res, 429, { hata: "çok hızlı" });
  let govde = "";
  for await (const p of req) { govde += p; if (govde.length > 200_000) return cevap(res, 413, { hata: "büyük" }); }
  let j;
  try { j = JSON.parse(govde); } catch { return cevap(res, 400, { hata: "gövde" }); }
  log("istek", req.url, String(j.token || "").slice(0, 8), `len=${String(j.token || "").length}`);
  if (!jetonGecerli(j.token)) return cevap(res, 400, { hata: "jeton" });
  try {
    if (req.url === "/bildirim/sil") {
      await db.query("delete from bildirim_abone where token = $1", [j.token]);
      return cevap(res, 200, { ok: true });
    }
    if (req.url !== "/bildirim/kayit") return cevap(res, 404, { hata: "yok" });
    const sanatcilar = [...new Set((Array.isArray(j.sanatcilar) ? j.sanatcilar : []).slice(0, 300).map(katla).filter(Boolean))];
    const sarkilar = [...new Set((Array.isArray(j.sarkilar) ? j.sarkilar : []).slice(0, 500)
      .map((s) => `${katla(s?.sanatci)}|${katla(s?.baslik)}`).filter((k) => !k.startsWith("|") && !k.endsWith("|")))];
    const ortam = j.ortam === "sandbox" ? "sandbox" : "production";
    const dil = String(j.dil || "tr").slice(0, 8);
    let tz = String(j.saatDilimi || "Europe/Istanbul").slice(0, 64);
    try { new Intl.DateTimeFormat("en", { timeZone: tz }); } catch { tz = "Europe/Istanbul"; }
    await db.query(
      `insert into bildirim_abone (token, ortam, dil, saat_dilimi, sanatcilar, sarkilar, son_gorulme)
       values ($1,$2,$3,$4,$5,$6, now())
       on conflict (token) do update set ortam=excluded.ortam, dil=excluded.dil, saat_dilimi=excluded.saat_dilimi,
         sanatcilar=excluded.sanatcilar, sarkilar=excluded.sarkilar, son_gorulme=now()`,
      [j.token, ortam, dil, tz, sanatcilar, sarkilar]);
    aboneZaman = 0; // bir sonraki turda yeniden yükle
    log("kayıt", j.token.slice(0, 8), ortam, `${sanatcilar.length} sanatçı, ${sarkilar.length} şarkı`);
    return cevap(res, 200, { ok: true, sanatci: sanatcilar.length, sarki: sarkilar.length });
  } catch (e) {
    log("! kayıt:", e.message);
    return cevap(res, 500, { hata: "sunucu" });
  }
});

// ---------------------------------------------------------------- APNs
let jwt = null, jwtZaman = 0;
function apnsJetonu() {
  if (jwt && Date.now() - jwtZaman < 50 * 60_000) return jwt;
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const veri = `${b64({ alg: "ES256", kid: env.APNS_KEY_ID })}.${b64({ iss: env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) })}`;
  const imza = crypto.sign("sha256", Buffer.from(veri), { key: readFileSync(env.APNS_KEY_PATH, "utf8"), dsaEncoding: "ieee-p1363" });
  jwt = `${veri}.${imza.toString("base64url")}`; jwtZaman = Date.now();
  return jwt;
}
const oturumlar = {};
function oturum(ortam) {
  const o = oturumlar[ortam];
  if (o && !o.closed && !o.destroyed) return o;
  const yeni = http2.connect(ortam === "sandbox" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com");
  yeni.on("error", (e) => log("! apns oturum:", e.message));
  oturumlar[ortam] = yeni;
  return yeni;
}
function apnsGonder(a, yuk) {
  return new Promise((coz) => {
    const r = oturum(a.ortam).request({
      ":method": "POST", ":path": `/3/device/${a.token}`, authorization: `bearer ${apnsJetonu()}`,
      "apns-topic": KONU, "apns-push-type": "alert", "apns-priority": "5", "apns-expiration": String(Math.floor(Date.now() / 1000) + 600),
      "content-type": "application/json",
    });
    let govde = "";
    r.setEncoding("utf8");
    r.on("response", (h) => { r.on("data", (d) => (govde += d)); r.on("end", () => coz({ kod: h[":status"], govde })); });
    r.on("error", (e) => coz({ kod: 0, govde: e.message }));
    r.end(JSON.stringify(yuk));
  });
}

// ---------------------------------------------------------------- nöbet
let aboneler = [], aboneZaman = 0;
const sanatciDizini = new Map(), sarkiDizini = new Map(); // anahtar → [abone]
async function aboneYukle() {
  if (Date.now() - aboneZaman < 5 * 60_000) return;
  const { rows } = await db.query("select token, ortam, dil, saat_dilimi, sanatcilar, sarkilar from bildirim_abone");
  aboneler = rows; aboneZaman = Date.now();
  sanatciDizini.clear(); sarkiDizini.clear();
  for (const a of rows) {
    for (const s of a.sanatcilar) (sanatciDizini.get(s) || sanatciDizini.set(s, []).get(s)).push(a);
    for (const s of a.sarkilar) (sarkiDizini.get(s) || sarkiDizini.set(s, []).get(s)).push(a);
  }
}

let izinli = new Map(), izinliZaman = 0; // slug → radyo adı (yalnız uygulamada izinli olanlar)
async function izinliYukle() {
  if (Date.now() - izinliZaman < 10 * 60_000 && izinli.size) return;
  const r = await fetch("https://nowby.co/api/now?uygulama=1", { signal: AbortSignal.timeout(15_000) });
  const { stations } = await r.json();
  if (stations?.length) {
    izinli = new Map(stations.map((s) => [s.slug, s.name])); izinliZaman = Date.now();
    // Uygulamanın "Hepsi" listesi önbelleği için izinli küme (sunucu/arsiv/liste-kapsam.sql); yalnız değişince yazar.
    const sluglar = [...izinli.keys()].sort();
    if (sluglar.join(",") !== kapsamSon) {
      try {
        await db.query(`insert into liste_kapsam (ad, sluglar, guncel) values ('izinli', $1, now())
                        on conflict (ad) do update set sluglar = excluded.sluglar, guncel = now()`, [sluglar]);
        kapsamSon = sluglar.join(",");
      } catch (e) { log("! kapsam:", e.message); }
    }
  }
}
let kapsamSon = "";

function sessizMi(tz) {
  const saat = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date()));
  return saat >= SESSIZ_BAS || saat < SESSIZ_BIT;
}

function metin(dil, tur, p, radyo) {
  const tr = dil.startsWith("tr");
  const sarki = `${p.artist} — ${p.title}`;
  if (tur === "s") return { title: tr ? "♪ Sevdiğin şarkı çalıyor" : "♪ A song you love is on", body: `${sarki} · ${radyo}` };
  return { title: tr ? `♪ ${p.artist} çalıyor` : `♪ ${p.artist} is on`, body: `${p.title} · ${radyo}` };
}

const islenen = new Set(); // "slug|started_at" — aynı çalış iki turda iki kez sayılmasın
async function tur() {
  await Promise.all([aboneYukle(), izinliYukle()]);
  if (!aboneler.length) return;
  const { rows } = await db.query(
    `select p.started_at t, s.slug, p.artist, p.title from plays p join stations s on s.id = p.station_id
     where p.started_at > now() - ($1 || ' milliseconds')::interval
       and coalesce(p.artist,'') <> '' and coalesce(p.title,'') <> ''
     order by p.started_at`, [GERI]);

  for (const p of rows) {
    const id = `${p.slug}|${new Date(p.t).getTime()}`;
    if (islenen.has(id)) continue;
    islenen.add(id);
    const radyo = izinli.get(p.slug);
    if (!radyo || COP.test(`${p.artist} ${p.title}`)) continue;
    const ka = katla(p.artist), ks = `${ka}|${katla(p.title)}`;
    const adaylar = new Map(); // token → tür (şarkı eşleşmesi sanatçıdan önce gelir)
    for (const a of sarkiDizini.get(ks) || []) adaylar.set(a.token, { a, tur: "s" });
    for (const a of sanatciDizini.get(ka) || []) if (!adaylar.has(a.token)) adaylar.set(a.token, { a, tur: "a" });
    for (const { a, tur: t } of adaylar.values()) await belki(a, t, t === "s" ? `s:${ks}` : `a:${ka}`, p, radyo);
  }
  if (islenen.size > 20_000) islenen.clear();
}

async function belki(a, t, anahtar, p, radyo) {
  if (sessizMi(a.saat_dilimi)) return;
  const { rows } = await db.query(
    `select anahtar, zaman from bildirim_gonderilen where token = $1 and zaman > now() - interval '24 hours'`, [a.token]);
  if (rows.length >= GUNLUK) return;
  const ara = t === "s" ? SARKI_ARA : SANATCI_ARA;
  if (rows.some((r) => r.anahtar === anahtar && Date.now() - new Date(r.zaman).getTime() < ara)) return;
  const yuk = { aps: { alert: metin(a.dil, t, p, radyo), sound: "default", "thread-id": "sevilen" }, slug: p.slug };
  if (KURU) { log("KURU", a.token.slice(0, 8), anahtar, yuk.aps.alert.body); return; }
  const s = await apnsGonder(a, yuk);
  if (s.kod === 200) {
    await db.query("insert into bildirim_gonderilen (token, anahtar) values ($1, $2)", [a.token, anahtar]);
    log("→", a.token.slice(0, 8), anahtar);
  } else if (s.kod === 410 || /BadDeviceToken|Unregistered|DeviceTokenNotForTopic/.test(s.govde)) {
    await db.query("delete from bildirim_abone where token = $1", [a.token]);
    aboneZaman = 0;
    log("× jeton silindi", a.token.slice(0, 8), s.govde);
  } else {
    log("! apns", s.kod, s.govde);
  }
}

async function temizlik() {
  await db.query("delete from bildirim_gonderilen where zaman < now() - interval '3 days'");
  await db.query("delete from bildirim_abone where son_gorulme < now() - interval '90 days'");
}

sunucu.listen(PORT, "127.0.0.1", () => log(`sevilen ucu 127.0.0.1:${PORT}${KURU ? " (KURU)" : ""}`));
let sonTemizlik = 0;
for (;;) {
  const bas = Date.now();
  try {
    await tur();
    if (Date.now() - sonTemizlik > 86_400_000) { await temizlik(); sonTemizlik = Date.now(); }
  } catch (e) {
    log("! tur:", e.message);
  }
  await new Promise((r) => setTimeout(r, Math.max(5_000, ARALIK - (Date.now() - bas))));
}
