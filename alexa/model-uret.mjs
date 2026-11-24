// nowby. Alexa etkileşim modeli üretici: izinli radyoların adlarını RADYO yuvasına yazar.
// Kullanım: node alexa/model-uret.mjs  → alexa/model/en-US.json, en-GB.json, de-DE.json
// Radyo eklenince yeniden çalıştırılır, çıkan JSON Alexa geliştirici konsolunda "JSON Editor"e yapıştırılır.
import { writeFileSync, mkdirSync } from "node:fs";

const URL_ = "https://uiouzizblrkojmsqvbjk.supabase.co/rest/v1/stations?select=slug,name,stream_url&is_active=eq.true&app_izinli=eq.true&order=sort_order";
const ANON = "sb_publishable_NgT0RLV5C56i1O64eWmv9g_IcAqk5Hg"; // herkese açık, salt okunur (uygulamalardaki anahtar)
const DISARIDA = new Set(["rmfm-trance", "0nlineradio-soft-rock"]); // lib/alexa.ts ile aynı

const r = await fetch(URL_, { headers: { apikey: ANON } });
const liste = (await r.json()).filter((s) => (s.stream_url ?? "").startsWith("https://") && !DISARIDA.has(s.slug));

// Konuşmada söylenen biçimler: "FM", "Radyo/Radio" olmadan ve Türkçe harfler sadeleşmiş hâliyle.
const sade = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/İ/g, "I");
function esler(ad) {
  const e = new Set([sade(ad), ad.replace(/\b(Radyo|Radio|FM)\b/gi, "").replace(/\s+/g, " ").trim(), sade(ad).replace(/\b(Radyo|Radio|FM)\b/gi, "").replace(/\s+/g, " ").trim()]);
  e.delete(ad); e.delete("");
  return [...e].filter((x) => x.length > 1);
}
const degerler = liste.map((s) => ({ id: s.slug, name: { value: s.name, synonyms: esler(s.name) } }));

const ornek = {
  en: {
    cal: ["play {radyo}", "put on {radyo}", "start {radyo}", "listen to {radyo}", "play the station {radyo}", "switch to {radyo}"],
    ne: ["what's playing", "what is playing", "what song is this", "what's this song", "who is singing", "what's on", "what song is playing", "name this song"],
  },
  de: {
    cal: ["spiele {radyo}", "spiel {radyo}", "starte {radyo}", "ich möchte {radyo} hören", "wechsle zu {radyo}", "spiele den sender {radyo}"],
    ne: ["was läuft gerade", "was läuft", "welcher song ist das", "wer singt das", "welches lied ist das", "was ist das für ein lied", "was spielt gerade"],
  },
};

function model(dil) {
  const o = ornek[dil];
  return {
    interactionModel: {
      languageModel: {
        invocationName: "now by",
        intents: [
          { name: "RadyoCalIntent", slots: [{ name: "radyo", type: "RADYO" }], samples: o.cal },
          { name: "SimdiNeCaliyorIntent", slots: [], samples: o.ne },
          ...["CancelIntent", "HelpIntent", "StopIntent", "NavigateHomeIntent", "FallbackIntent", "PauseIntent",
            "ResumeIntent", "NextIntent", "PreviousIntent", "LoopOffIntent", "LoopOnIntent", "RepeatIntent",
            "ShuffleOffIntent", "ShuffleOnIntent", "StartOverIntent"].map((n) => ({ name: `AMAZON.${n}`, samples: [] })),
        ],
        types: [{ name: "RADYO", values: degerler }],
      },
    },
  };
}

mkdirSync(new URL("./model/", import.meta.url), { recursive: true });
for (const [dosya, dil] of [["en-US", "en"], ["en-GB", "en"], ["de-DE", "de"]]) {
  writeFileSync(new URL(`./model/${dosya}.json`, import.meta.url), JSON.stringify(model(dil), null, 2) + "\n");
}
console.log(`${liste.length} radyo yazıldı (en-US, en-GB, de-DE).`);
