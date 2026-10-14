// ŞİMDİ — Senkron nöbetçisi (sunucuda 7/24).
// Aynı şarkı AYNI DAKİKA içinde 2+ ayrı Türk radyosunda başlarsa bu bir
// SENKRON ANI'dır: senkron_anlari'na yazılır, sitede bant + kart olur.
// Veri (ikiz yayınlar ayıklandıktan sonra, 7 gün): 1 dk penceresinde 2 radyo
// 9 kez (günde ~1-2), 3+ radyo HİÇ → 3+ olursa kendiliğinden rekor.
// Açılışta son 1 saati tarar, sonra 30 sn'de bir yalnız
// yeni çalmaları çekip son 12 dk'yı bellekteki tamponda değerlendirir.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const ESIK = 2;                 // en az kaç ayrı radyo
const PENCERE = 60_000;         // başlangıçlar arası en fazla 1 dk
const BIRLESTIR = 15 * 60_000;  // aynı şarkının 15 dk içindeki anları tek an
const ARALIK = 30_000;

const env = Object.fromEntries(
  readFileSync("/opt/simdi-collector/.env.local", "utf8")
    .split("\n").filter((s) => s.includes("="))
    .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1).trim()]),
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const log = (...a) => console.log(new Date().toISOString(), ...a);

function katla(t) {
  return String(t || "")
    .replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}
const COP = /(https?:|www\.|\.com|\.net|<|jingle|reklam|now playing)/i;

let istasyonlar = new Map();
let istZaman = 0;
async function istasyonYukle() {
  if (Date.now() - istZaman < 10 * 60_000 && istasyonlar.size) return;
  const { data, error } = await sb.from("stations").select("id, slug, name").eq("is_active", true).eq("band", "tr");
  if (error) throw error;
  istasyonlar = new Map(data.map((s) => [s.id, s]));
  istZaman = Date.now();
}

// Ham çalmaları çeker (id dahil). bas: ISO zaman.
async function cek(bas) {
  const idler = [...istasyonlar.keys()];
  const hepsi = [];
  for (let off = 0; ; off += 1000) {
    const { data, error } = await sb.from("plays")
      .select("id, artist, title, station_id, started_at")
      .in("station_id", idler).gte("started_at", bas)
      .order("started_at").range(off, off + 999);
    if (error) throw error;
    hepsi.push(...data);
    if (data.length < 1000) break;
  }
  return hepsi;
}

// Son 12 dakikanın çalmaları bellekte (id → çalma). Eskiden her 30 sn'de
// 12 dk baştan okunuyordu (her satır ~24 kez → ~200 MB/gün egress); artık
// yalnız son başarılı okumadan 1 dk öncesine kadar çekilir, id ile ayıklanır.
// Tur atlansa bile sonraki tur aradakini yakalar → kayıp yok.
const TAMPON = 12 * 60_000;
const ORTUSME = 60_000;
const ACILIS_TARAMA = 3600_000;
const tampon = new Map();
let sonOkuma = 0;

function tamponaEkle(rows, simdi) {
  for (const p of rows) tampon.set(p.id, p);
  for (const [id, p] of tampon) if (simdi - Date.parse(p.started_at) > TAMPON) tampon.delete(id);
}

function suz(rows) {
  return rows.filter((p) => {
    const s = istasyonlar.get(p.station_id);
    if (!s || !p.artist || !p.title) return false;
    const a = katla(p.artist), t = katla(p.title), n = katla(s.name);
    return a && t && a !== t && a !== n && t !== n && !COP.test(p.artist) && !COP.test(p.title)
      && !p.artist.includes("~") && !p.title.includes("~");
  });
}

// Her şarkı için PENCERE içinde ESIK+ farklı istasyonda başladığı anları bul.
function anlariBul(ps) {
  const grup = new Map();
  for (const p of ps) {
    const k = `${katla(p.artist)}|${katla(p.title)}`;
    if (!grup.has(k)) grup.set(k, []);
    grup.get(k).push(p);
  }
  const anlar = [];
  for (const [anahtar, liste] of grup) {
    if (liste.length < ESIK) continue;
    liste.sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
    for (let i = 0; i < liste.length; i++) {
      const t0 = Date.parse(liste[i].started_at);
      const ist = new Map();
      let j = i;
      for (; j < liste.length && Date.parse(liste[j].started_at) - t0 <= PENCERE; j++) {
        const s = istasyonlar.get(liste[j].station_id);
        if (!ist.has(s.slug)) ist.set(s.slug, { slug: s.slug, name: s.name, t: liste[j].started_at });
      }
      if (ist.size >= ESIK) {
        const iler = [...ist.values()];
        anlar.push({
          anahtar, artist: liste[i].artist, title: liste[i].title,
          istasyonlar: iler, sayi: iler.length,
          ilk: iler[0].t, son: iler[iler.length - 1].t,
        });
        i = j - 1; // bu pencereyi tüket
      }
    }
  }
  return anlar;
}

async function kaydet(an) {
  const esik = new Date(Date.parse(an.ilk) - BIRLESTIR).toISOString();
  const { data: var_ } = await sb.from("senkron_anlari").select("*")
    .eq("anahtar", an.anahtar).gte("son", esik).order("son", { ascending: false }).limit(1);
  if (var_?.length) {
    const eski = var_[0];
    const birlesik = new Map(eski.istasyonlar.map((s) => [s.slug, s]));
    for (const s of an.istasyonlar) if (!birlesik.has(s.slug)) birlesik.set(s.slug, s);
    if (birlesik.size === eski.sayi) return;
    const iler = [...birlesik.values()].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
    await sb.from("senkron_anlari").update({
      istasyonlar: iler, sayi: iler.length, son: iler[iler.length - 1].t,
    }).eq("id", eski.id);
    log(`⚡↑ #${eski.id} ${an.artist} — ${an.title}: artık ${iler.length} radyo`);
    return;
  }
  const { data, error } = await sb.from("senkron_anlari").insert(an).select("id").single();
  if (error) { log("! yazılamadı:", error.message); return; }
  log(`⚡ SENKRON #${data.id}: ${an.artist} — ${an.title} · ${an.sayi} radyo (${an.istasyonlar.map((s) => s.name).join(", ")})`);
}

// Bu süreçte zaten yazılmış/güncellenmiş anlar: aynı pencere her 30 sn'de
// yeniden bulunur; değişmediyse senkron_anlari'na tekrar sorgu atma.
const yazilan = new Set();

async function kaydetBirKez(an) {
  const k = `${an.anahtar}|${an.ilk}|${an.sayi}`;
  if (yazilan.has(k)) return;
  await kaydet(an);
  yazilan.add(k);
  if (yazilan.size > 5000) yazilan.clear();
}

async function tur() {
  await istasyonYukle();
  const simdi = Date.now();
  const bas = sonOkuma ? sonOkuma - ORTUSME : simdi - TAMPON;
  tamponaEkle(await cek(new Date(bas).toISOString()), simdi);
  sonOkuma = simdi;
  const anlar = anlariBul(suz([...tampon.values()]));
  for (const an of anlar) await kaydetBirKez(an);
}

log(`Senkron nöbetçisi başladı — eşik ${ESIK} radyo / ${PENCERE / 1000} sn.`);
try {
  await istasyonYukle();
  const simdi = Date.now();
  // Eskiden 7 gün (defter boşken). plays büyüdü → statement timeout; geçmiş
  // anlar zaten senkron_anlari'nda. Yeniden başlatmada son 1 saat yeter.
  const gecmis = await cek(new Date(simdi - ACILIS_TARAMA).toISOString());
  for (const an of anlariBul(suz(gecmis))) await kaydetBirKez(an);
  tamponaEkle(gecmis.filter((p) => simdi - Date.parse(p.started_at) <= TAMPON), simdi);
  sonOkuma = simdi;
  log(`Açılış: son 1 saat tarandı (${gecmis.length} çalma).`);
} catch (e) { log("! geçmiş taraması:", e.message); }

setInterval(() => {
  tur().catch((e) => log("! tur:", e.message));
}, ARALIK);
