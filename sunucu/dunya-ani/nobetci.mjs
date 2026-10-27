// nowby. — "Aynı anda" nöbetçisi (27 Ekim 2026, Hetzner'de 7/24).
// Birbirinden habersiz radyolar, en az iki kıtada ve üç ülkede, aynı dakikalarda aynı şarkıyı
// çalarsa bu bir DÜNYA ANI'dır: dunya_anlari'na yazılır (site arşivi + web push sonradan).
//
// 30 günlük arşiv ölçümü (27 Eki): süzgeçsiz 3+ ülke günde ~5,6 an, çoğu hit rotasyonu ve
// yayın ağları. Süzgeçle (aşağıda) 30 günde 11 an, hepsi eski şarkılar → ~3 günde bir.
//   * Yayın ağı: 30 günde 10+ kez birlikte görünen istasyon çifti tek radyo sayılır.
//   * Hit: 30 günde 6+ ayrı anda görünen şarkı sayılmaz.
//   * Kıta: en az 2 (Türkiye kendi başına bir kıta sayılır).
// Veri Hetzner arşivinden okunur (Supabase'e yük yok). Ülke eşlemesi nowby.co/api/now'dan.

import pg from "pg";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import webpush from "/opt/simdi/radar/node_modules/web-push/src/index.js";

const PENCERE = 5 * 60_000;      // aynı şarkının başlangıçları arası en fazla 5 dk (zincir)
const GERI = Number(process.env.GERI_MS) || 12 * 60_000; // her turda son 12 dk okunur
const KURU = process.env.KURU === "1"; // deneme: yazmaz, yalnız basar, tek tur
const TEK = process.env.TEK === "1"; // geçmişi doldurma: yazar, tek tur
const GERI_SON = Number(process.env.GERI_SON_MS) || 0; // geçmiş doldurmada pencerenin yeni ucu
const ARALIK = 60_000;
const TEKRAR = 60 * 60_000;      // aynı şarkı 60 dk içinde ikinci kez an olmaz (varsa güncellenir)
const AG_ESIK = 10, HIT_ESIK = 6, ULKE_ESIK = 3, KITA_ESIK = 2;

const env = Object.fromEntries(
  readFileSync("/opt/simdi-collector/.env.local", "utf8")
    .split("\n").filter((s) => s.includes("="))
    .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1).trim()]),
);
const db = new pg.Pool({ connectionString: env.ARSIV_PG_URL, max: 2, idleTimeoutMillis: 30_000 });
const log = (...a) => console.log(new Date().toISOString(), ...a);

// ---- web push (27 Eki): yalnız nowby.co/ayni-anda'da abone olanlara; radar ile aynı VAPID çifti ----
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const vapid = JSON.parse(readFileSync("/opt/simdi/radar/vapid.json", "utf8"));
webpush.setVapidDetails("mailto:hello@berkaydogan.co", vapid.publicKey, vapid.privateKey);
const BILDIRIM_ARA = 3 * 3600_000; // iki bildirim arası en az 3 saat (an yine arşive yazılır)
let sonBildirim = 0;

// Bildirim cümlesi için ülke adları: Türkçede bulunma hâli elle (ünlü uyumu + sert ünsüz + kısaltma okunuşu).
const ULKE_TR = {
  tr: "Türkiye'de", de: "Almanya'da", fr: "Fransa'da", gb: "Birleşik Krallık'ta", us: "ABD'de", it: "İtalya'da",
  es: "İspanya'da", nl: "Hollanda'da", be: "Belçika'da", ch: "İsviçre'de", at: "Avusturya'da", pt: "Portekiz'de",
  gr: "Yunanistan'da", se: "İsveç'te", no: "Norveç'te", dk: "Danimarka'da", fi: "Finlandiya'da", ie: "İrlanda'da",
  pl: "Polonya'da", cz: "Çekya'da", hu: "Macaristan'da", ro: "Romanya'da", jp: "Japonya'da", kr: "Güney Kore'de",
  in: "Hindistan'da", br: "Brezilya'da", ar: "Arjantin'de", mx: "Meksika'da", ca: "Kanada'da", au: "Avustralya'da",
  za: "Güney Afrika'da", ru: "Rusya'da", ua: "Ukrayna'da", rs: "Sırbistan'da", hr: "Hırvatistan'da", bg: "Bulgaristan'da",
  is: "İzlanda'da", cn: "Çin'de", kz: "Kazakistan'da", id: "Endonezya'da", th: "Tayland'da", vn: "Vietnam'da",
  ph: "Filipinler'de", cl: "Şili'de", co: "Kolombiya'da", pe: "Peru'da", ma: "Fas'ta", eg: "Mısır'da",
  ae: "Birleşik Arap Emirlikleri'nde", ng: "Nijerya'da", ke: "Kenya'da",
};
const ULKE_EN = {
  tr: "Türkiye", de: "Germany", fr: "France", gb: "the United Kingdom", us: "the United States", it: "Italy",
  es: "Spain", nl: "the Netherlands", be: "Belgium", ch: "Switzerland", at: "Austria", pt: "Portugal",
  gr: "Greece", se: "Sweden", no: "Norway", dk: "Denmark", fi: "Finland", ie: "Ireland", pl: "Poland",
  cz: "Czechia", hu: "Hungary", ro: "Romania", jp: "Japan", kr: "South Korea", in: "India", br: "Brazil",
  ar: "Argentina", mx: "Mexico", ca: "Canada", au: "Australia", za: "South Africa", ru: "Russia", ua: "Ukraine",
  rs: "Serbia", hr: "Croatia", bg: "Bulgaria", is: "Iceland", cn: "China", kz: "Kazakhstan", id: "Indonesia",
  th: "Thailand", vn: "Vietnam", ph: "the Philippines", cl: "Chile", co: "Colombia", pe: "Peru", ma: "Morocco",
  eg: "Egypt", ae: "the United Arab Emirates", ng: "Nigeria", ke: "Kenya",
};
const birlestir = (l, ve) => (l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} ${ve} ${l.at(-1)}`);
function bildirimMetni(an, ulkeler, dil) {
  const sarki = `${an.artist} — ${an.title}`;
  if (dil === "en") {
    const l = ulkeler.map((u) => ULKE_EN[u] || u.toUpperCase());
    return { baslik: "🌍 Same time", metin: `${sarki} is playing right now in ${birlestir(l, "and")}.`, url: "/en/same-time" };
  }
  const l = ulkeler.map((u) => ULKE_TR[u] || `${u.toUpperCase()}'de`);
  return { baslik: "🌍 Aynı anda", metin: `${sarki} şu an ${birlestir(l, "ve")} çalıyor.`, url: "/ayni-anda" };
}

async function bildir(id, an, ulkeler) {
  if (Date.now() - sonBildirim < BILDIRIM_ARA) { log(`🔕 an #${id}: son bildirimden 3 saat geçmedi, gönderilmedi`); return; }
  const { data: aboneler, error } = await sb.from("ayni_anda_abone").select("endpoint, abone, dil");
  if (error) { log("! aboneler okunamadı:", error.message); return; }
  sonBildirim = Date.now();
  let giden = 0;
  for (const a of aboneler || []) {
    const m = bildirimMetni(an, ulkeler, a.dil);
    try {
      await webpush.sendNotification(a.abone, JSON.stringify({ ...m, tag: `dunya-ani-${id}` }), { TTL: 1800, urgency: "normal" });
      giden++;
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) await sb.from("ayni_anda_abone").delete().eq("endpoint", a.endpoint);
      else log("! push:", err?.statusCode || err?.message);
    }
  }
  await sb.from("ayni_anda_abone").update({ son_bildirim: new Date().toISOString() }).in("endpoint", (aboneler || []).map((a) => a.endpoint));
  await db.query("update dunya_anlari set bildirim = now() where id = $1", [id]);
  log(`🔔 an #${id}: ${giden}/${(aboneler || []).length} aboneye gitti`);
}

const KITA = {};
for (const k of "at be bg ch cz de dk es fi fr gb gr hr hu ie is it nl no pl pt ro rs se ua ru".split(" ")) KITA[k] = "Avrupa";
for (const k of "ae cn id in jp kr kz ph th vn".split(" ")) KITA[k] = "Asya";
for (const k of "eg ke ma ng za".split(" ")) KITA[k] = "Afrika";
for (const k of "ca mx us".split(" ")) KITA[k] = "Kuzey Amerika";
for (const k of "ar br cl co pe".split(" ")) KITA[k] = "Güney Amerika";
KITA.au = "Okyanusya";
KITA.tr = "Türkiye";
const kita = (u) => KITA[u] || u; // bilinmeyen ülke kendi başına sayılır

// Harf dizisinden bağımsız katlama: Kiril, Yunan, Japonca da kalır (sarki_slug bunları siliyordu).
const katla = (s) => String(s || "").toLocaleLowerCase("tr").normalize("NFKD").replace(/\p{M}/gu, "")
  .replace(/ı/g, "i").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const COP = /(https?:|www\.|\.(com|de|fr|es|it|net)\b|<|jingle|news|nachrichten|advert|werbung|reklam|haber|programa|unknown|verbraucherinformation|now playing)/i;

// ---- ülke eşlemesi ----
let ulke = new Map();
let ulkeZaman = 0;
async function ulkeYukle() {
  if (Date.now() - ulkeZaman < 10 * 60_000 && ulke.size) return;
  const r = await fetch("https://nowby.co/api/now", { signal: AbortSignal.timeout(15_000) });
  const { stations } = await r.json();
  const yeni = new Map(stations.filter((s) => s.country && s.country !== "www").map((s) => [s.slug, s.country]));
  if (!yeni.size) return;
  ulke = yeni;
  ulkeZaman = Date.now();
  const c = await db.connect();
  try {
    await c.query("begin");
    await c.query("delete from istasyon_ulke");
    await c.query("insert into istasyon_ulke (slug, ulke) select * from unnest($1::text[], $2::text[])", [[...ulke.keys()], [...ulke.values()]]);
    await c.query("commit");
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}

// ---- süzgeç: yayın ağları ve hitler (günde bir, 30 gün) ----
let ata = new Map();
let hitler = new Set();
let suzgecZaman = 0;
const bul = (x) => { while (ata.has(x) && ata.get(x) !== x) x = ata.get(x); return x; };
async function suzgecYukle() {
  if (Date.now() - suzgecZaman < 24 * 3600_000 && suzgecZaman) return;
  const c = await db.connect();
  try {
    await c.query("set statement_timeout = '240s'; set work_mem = '256MB'");
    const { rows } = await c.query(`
      with ham as (
        select p.started_at t, s.slug, u.ulke, p.artist, p.title
        from plays p join stations s on s.id = p.station_id join istasyon_ulke u on u.slug = s.slug
        where p.started_at > now() - interval '30 days'
          and coalesce(p.artist,'') <> '' and coalesce(p.title,'') <> '' and lower(p.artist) <> lower(p.title)
      ),
      k as (select *, lower(regexp_replace(artist || '|' || title, '[^[:alnum:]|]+', ' ', 'g')) anahtar from ham),
      sirali as (select *, case when t - lag(t) over (partition by anahtar order by t) <= interval '5 minutes' then 0 else 1 end yeni from k),
      gruplu as (select *, sum(yeni) over (partition by anahtar order by t) g from sirali)
      select anahtar, array_agg(distinct slug) slugs from gruplu group by anahtar, g having count(distinct ulke) >= 2`);
    const cift = new Map(), sarki = new Map();
    for (const r of rows) {
      sarki.set(r.anahtar, (sarki.get(r.anahtar) || 0) + 1);
      const s = [...r.slugs].sort();
      for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
        const a = `${s[i]} ${s[j]}`;
        cift.set(a, (cift.get(a) || 0) + 1);
      }
    }
    const yeniAta = new Map();
    ata = yeniAta;
    for (const [a, n] of cift) if (n >= AG_ESIK) { const [x, y] = a.split(" "); yeniAta.set(bul(x), bul(y)); }
    hitler = new Set([...sarki].filter(([, n]) => n >= HIT_ESIK).map(([k]) => k));
    suzgecZaman = Date.now();
    log(`süzgeç: ${rows.length} an (30 gün), ${yeniAta.size} ağ bağı, ${hitler.size} hit`);
  } finally {
    c.release();
  }
}
// Süzgeç SQL'indeki anahtar ile canlı anahtar aynı olmalı: Postgres tarafı [:alnum:] ile katlar.
const hitAnahtari = (artist, title) => (artist + "|" + title).toLowerCase().replace(/[^\p{L}\p{N}|]+/gu, " ");

// ---- canlı tur ----
const sonAnlar = new Map(); // katlanmış anahtar → { id, zaman, ulkeSayi }
async function tur() {
  await ulkeYukle();
  await suzgecYukle();
  const { rows } = await db.query(
    `select p.started_at t, s.slug, s.name ad, p.artist, p.title
     from plays p join stations s on s.id = p.station_id
     where p.started_at > now() - ($1 || ' milliseconds')::interval
       and p.started_at <= now() - ($2 || ' milliseconds')::interval
       and coalesce(p.artist,'') <> '' and coalesce(p.title,'') <> ''`, [GERI, GERI_SON]);

  const gruplar = new Map();
  for (const r of rows) {
    const u = ulke.get(r.slug);
    if (!u || COP.test(`${r.artist} ${r.title}`)) continue;
    if (katla(r.artist) === katla(r.title)) continue;
    const ad = katla(r.ad);
    if (ad.includes(katla(r.artist)) || ad.includes(katla(r.title))) continue;
    const k = `${katla(r.artist)}|${katla(r.title)}`;
    if (!gruplar.has(k)) gruplar.set(k, []);
    gruplar.get(k).push({ ...r, ulke: u, t: new Date(r.t).getTime() });
  }

  for (const [k, liste] of gruplar) {
    liste.sort((a, b) => a.t - b.t);
    // zincirler: ardışık başlangıçlar arası PENCERE'yi aşmayan parçalar (her biri ayrı değerlendirilir)
    const zincirler = [[liste[0]]];
    for (let i = 1; i < liste.length; i++) {
      if (liste[i].t - liste[i - 1].t <= PENCERE) zincirler.at(-1).push(liste[i]);
      else zincirler.push([liste[i]]);
    }
    for (const an of zincirler) await anDegerlendir(k, an);
  }
  for (const [k, v] of sonAnlar) if (Date.now() - v.zaman > 2 * TEKRAR) sonAnlar.delete(k);
}

async function anDegerlendir(k, an) {
  {
    if (hitler.has(hitAnahtari(an[0].artist, an[0].title))) return;
    const temsil = new Map(); // ağ başına bir radyo
    for (const r of an) if (!temsil.has(bul(r.slug))) temsil.set(bul(r.slug), r);
    const radyolar = [...temsil.values()];
    const ulkeler = [...new Set(radyolar.map((r) => r.ulke))].sort();
    const kitalar = new Set(ulkeler.map(kita));
    if (ulkeler.length < ULKE_ESIK || kitalar.size < KITA_ESIK) return;

    if (KURU) { log(`(kuru) ${new Date(an[0].t).toISOString()} ${an[0].artist} — ${an[0].title} · ${ulkeler.join(",")} · ${radyolar.map((r) => r.ad).join(" · ")}`); return; }
    const govde = radyolar.map((r) => ({ slug: r.slug, ad: r.ad, ulke: r.ulke, t: new Date(r.t).toISOString() }));
    const once = sonAnlar.get(k);
    if (once && an[0].t - once.zaman < TEKRAR) {
      if (ulkeler.length > once.ulkeSayi) {
        await db.query("update dunya_anlari set ulkeler = $1, radyolar = $2 where id = $3", [ulkeler, JSON.stringify(govde), once.id]);
        once.ulkeSayi = ulkeler.length;
        log(`↑ an #${once.id} büyüdü: ${ulkeler.join(",")}`);
      }
      return;
    }
    const { rows: [y] } = await db.query(
      `insert into dunya_anlari (zaman, anahtar, artist, title, ulkeler, radyolar)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [new Date(an[0].t), k, an[0].artist, an[0].title, ulkeler, JSON.stringify(govde)]);
    sonAnlar.set(k, { id: y.id, zaman: an[0].t, ulkeSayi: ulkeler.length });
    // Geçmiş doldurmada (TEK) ya da eski bir an için bildirim yok; yalnız son 15 dakikadaki canlı anlar.
    if (!TEK && Date.now() - an[0].t < 15 * 60_000) await bildir(y.id, an[0], ulkeler).catch((e) => log("! bildirim:", e.message));
    log(`🌍 DÜNYA ANI #${y.id}: ${an[0].artist} — ${an[0].title} · ${ulkeler.join(",")} (${radyolar.map((r) => r.ad).join(" · ")})`);
  }
}

async function main() {
  log("Aynı anda nöbetçisi başladı.");
  // Yeniden başlatmada son saatin anlarını belleğe al (tekrar yazmasın).
  const { rows } = await db.query("select id, anahtar, zaman, cardinality(ulkeler) n from dunya_anlari where zaman > now() - interval '2 hours'");
  for (const r of rows) sonAnlar.set(r.anahtar, { id: r.id, zaman: new Date(r.zaman).getTime(), ulkeSayi: r.n });
  const { rows: [b] } = await db.query("select max(bildirim) son from dunya_anlari");
  if (b?.son) sonBildirim = new Date(b.son).getTime();
  if (KURU || TEK) { await tur(); await db.end(); return; }
  for (;;) {
    const bas = Date.now();
    await tur().catch((e) => log("! tur:", e.message));
    await new Promise((r) => setTimeout(r, Math.max(5_000, ARALIK - (Date.now() - bas))));
  }
}

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { log(`${sig}, kapanıyor.`); process.exit(0); });
main().catch((e) => { log("ÖLÜMCÜL:", e.message); process.exit(1); });
