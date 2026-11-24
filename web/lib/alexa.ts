import { getSupabase } from "./supabase";
import { aktifIstasyonlar } from "./now";

// nowby. Alexa becerisi: izinli radyoları çalar, "şu an ne çalıyor" sorusunu cevaplar.
// Yalnız yazılı izinli radyolar (stations.app_izinli), uygulamalarla aynı küme.
// Alexa'dan kimlik, konum ya da ses kaydı alınmaz; çalan radyo yalnız Alexa'nın kendi
// "token" alanında taşınır.

export type Dil = "en" | "de";

type Radyo = { slug: string; name: string; akis: string };

// Türkiye'den 404 veren (bölge kısıtlı) akışlar: Alexa'da çalmaz, listeye girmez.
const DISARIDA = new Set(["rmfm-trance", "0nlineradio-soft-rock"]);

let onbellek: { at: number; liste: Radyo[] } | null = null;

export async function alexaRadyolari(): Promise<Radyo[]> {
  if (onbellek && Date.now() - onbellek.at < 10 * 60_000) return onbellek.liste;
  const { data, error } = await getSupabase()
    .from("stations")
    .select("slug, name, stream_url")
    .eq("is_active", true)
    .eq("app_izinli", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  const liste = (data ?? [])
    .map((s) => ({ slug: s.slug as string, name: s.name as string, akis: (s.stream_url ?? "") as string }))
    // AudioPlayer yalnız HTTPS akış çalar.
    .filter((r) => r.akis.startsWith("https://") && !DISARIDA.has(r.slug));
  onbellek = { at: Date.now(), liste };
  return liste;
}

const sade = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(radyo|radio|fm)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Alexa'nın çözdüğü kimlik (slug) önce; yoksa adı benzeyen radyo. */
export function radyoBul(liste: Radyo[], kimlik: string | undefined, soylenen: string | undefined): Radyo | null {
  if (kimlik) {
    const r = liste.find((x) => x.slug === kimlik);
    if (r) return r;
  }
  if (!soylenen) return null;
  // Boşluksuz karşılaştır ("joy turk rock" = "JoyTürk Rock"); birden çok aday varsa en uzun ad kazanır
  // ("joy turk rock" Joy Türk'e değil JoyTürk Rock'a gider).
  const bitisik = (x: string) => sade(x).replace(/ /g, "");
  const s = bitisik(soylenen);
  if (!s) return null;
  const enUzun = (f: (ad: string) => boolean) =>
    liste.filter((x) => f(bitisik(x.name))).sort((a, b) => bitisik(b.name).length - bitisik(a.name).length)[0];
  return (
    enUzun((ad) => ad === s) ??
    enUzun((ad) => s.startsWith(ad) || ad.startsWith(s)) ??
    enUzun((ad) => ad.includes(s) || s.includes(ad)) ??
    null
  );
}

export async function simdiCalan(slug: string): Promise<{ artist: string | null; title: string | null } | null> {
  const liste = await aktifIstasyonlar({ uygulama: true });
  const r = liste.find((x) => x.slug === slug);
  return r?.nowPlaying ? { artist: r.nowPlaying.artist, title: r.nowPlaying.title } : null;
}

export const metin = {
  en: {
    hos: (r: string) => `Here's ${r}, live on nowby.`,
    cal: (r: string) => `Playing ${r}.`,
    bulamadim: (s: string) => `I couldn't find ${s} on nowby. Try another station, or just say: open now by.`,
    calan: (r: string, sanatci: string, sarki: string) => `On ${r}: ${sarki}, by ${sanatci}.`,
    calanSarki: (r: string, sarki: string) => `On ${r}: ${sarki}.`,
    bilinmiyor: (r: string) => `${r} isn't sharing the song name right now.`,
    sessiz: "Nothing is playing on nowby right now. Say: open now by.",
    yardim: "nowby plays radio from around the world and tells you what's on. Say: play Radio Paradise, or: what's playing. Which station would you like?",
    hosca: "Goodbye.",
    anlamadim: "Sorry, I didn't get that. You can say: play FM4, or: what's playing.",
  },
  de: {
    hos: (r: string) => `Hier ist ${r}, live auf nowby.`,
    cal: (r: string) => `Ich spiele ${r}.`,
    bulamadim: (s: string) => `Ich habe ${s} auf nowby nicht gefunden. Versuch einen anderen Sender oder sag: öffne now by.`,
    calan: (r: string, sanatci: string, sarki: string) => `Auf ${r} läuft: ${sarki}, von ${sanatci}.`,
    calanSarki: (r: string, sarki: string) => `Auf ${r} läuft: ${sarki}.`,
    bilinmiyor: (r: string) => `${r} zeigt gerade keinen Songtitel an.`,
    sessiz: "Auf nowby läuft gerade nichts. Sag: öffne now by.",
    yardim: "nowby spielt Radio aus aller Welt und sagt dir, was gerade läuft. Sag: spiele FM4, oder: was läuft gerade. Welchen Sender möchtest du?",
    hosca: "Tschüss.",
    anlamadim: "Das habe ich nicht verstanden. Du kannst sagen: spiele FM4, oder: was läuft gerade.",
  },
} satisfies Record<Dil, unknown>;

export function dilSec(yerel: string | undefined): Dil {
  return yerel?.toLowerCase().startsWith("de") ? "de" : "en";
}

type Yanit = Record<string, unknown>;

export function yanit(parca: { soz?: string; directives?: unknown[]; bitir?: boolean; tekrar?: string }): Yanit {
  const response: Yanit = {};
  if (parca.soz) response.outputSpeech = { type: "PlainText", text: parca.soz };
  if (parca.tekrar) response.reprompt = { outputSpeech: { type: "PlainText", text: parca.tekrar } };
  if (parca.directives) response.directives = parca.directives;
  if (parca.bitir !== undefined) response.shouldEndSession = parca.bitir;
  return { version: "1.0", response };
}

export function calDirektifi(r: Radyo) {
  return {
    type: "AudioPlayer.Play",
    playBehavior: "REPLACE_ALL",
    audioItem: {
      stream: { url: r.akis, token: r.slug, offsetInMilliseconds: 0 },
      metadata: { title: r.name, subtitle: "nowby." },
    },
  };
}

export const durDirektifi = { type: "AudioPlayer.Stop" };
