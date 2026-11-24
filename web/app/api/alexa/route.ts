import { json } from "@/lib/json";
import { alexaIstegiMi } from "@/lib/alexa-dogrula";
import {
  alexaRadyolari, calDirektifi, dilSec, durDirektifi, metin, radyoBul, simdiCalan, yanit,
} from "@/lib/alexa";

// POST /api/alexa — nowby. Alexa becerisinin uç noktası (Alexa Skills Kit, HTTPS endpoint).
// Her istek önce Amazon imzasıyla doğrulanır; ALEXA_SKILL_ID varsa yalnız o beceri kabul edilir.
export const dynamic = "force-dynamic";

type Istek = {
  context?: { System?: { application?: { applicationId?: string } }; AudioPlayer?: { token?: string } };
  session?: { application?: { applicationId?: string } };
  request: {
    type: string;
    locale?: string;
    intent?: {
      name: string;
      slots?: Record<string, {
        value?: string;
        resolutions?: { resolutionsPerAuthority?: { status?: { code?: string }; values?: { value: { id: string; name: string } }[] }[] };
      }>;
    };
  };
};

export async function POST(req: Request) {
  const govde = await req.text();
  // Yerel deneme: yalnız geliştirme sunucusunda ve ALEXA_DENEME=1 ile imza atlanır (üretimde asla).
  const deneme = process.env.NODE_ENV !== "production" && process.env.ALEXA_DENEME === "1";
  if (!deneme && !(await alexaIstegiMi(govde, req.headers))) return json({ error: "imza" }, { status: 400 });

  const istek = JSON.parse(govde) as Istek;
  const beklenen = process.env.ALEXA_SKILL_ID;
  const gelen = istek.context?.System?.application?.applicationId ?? istek.session?.application?.applicationId;
  if (beklenen && gelen !== beklenen) return json({ error: "beceri" }, { status: 400 });

  try {
    return json(await isle(istek));
  } catch {
    const m = metin[dilSec(istek.request.locale)];
    return json(yanit({ soz: m.anlamadim, bitir: true }));
  }
}

async function isle(istek: Istek) {
  const t = istek.request.type;
  const m = metin[dilSec(istek.request.locale)];
  const sonToken = istek.context?.AudioPlayer?.token;
  const liste = await alexaRadyolari();
  const sonraki = (adim: number) => {
    const i = liste.findIndex((r) => r.slug === sonToken);
    return liste[(i + adim + liste.length) % liste.length];
  };

  // Oynatıcı olayları ve kumanda/ekran düğmeleri: konuşma eklenmez.
  if (t.startsWith("AudioPlayer.") || t === "SessionEndedRequest" || t === "System.ExceptionEncountered") {
    return yanit({});
  }
  if (t === "PlaybackController.PlayCommandIssued") return yanit({ directives: [calDirektifi(sonraki(0) ?? liste[0])] });
  if (t === "PlaybackController.NextCommandIssued") return yanit({ directives: [calDirektifi(sonraki(1))] });
  if (t === "PlaybackController.PreviousCommandIssued") return yanit({ directives: [calDirektifi(sonraki(-1))] });
  if (t === "PlaybackController.PauseCommandIssued") return yanit({ directives: [durDirektifi] });

  if (t === "LaunchRequest") {
    // Son dinlenen radyo varsa ondan devam; yoksa listenin başı.
    const r = liste.find((x) => x.slug === sonToken) ?? liste[0];
    return yanit({ soz: m.hos(r.name), directives: [calDirektifi(r)], bitir: true });
  }

  if (t !== "IntentRequest" || !istek.request.intent) return yanit({ soz: m.anlamadim, bitir: true });
  const niyet = istek.request.intent;

  switch (niyet.name) {
    case "RadyoCalIntent": {
      const slot = niyet.slots?.radyo;
      const cozum = slot?.resolutions?.resolutionsPerAuthority?.find((a) => a.status?.code === "ER_SUCCESS_MATCH");
      const r = radyoBul(liste, cozum?.values?.[0]?.value.id, slot?.value);
      if (!r) return yanit({ soz: m.bulamadim(slot?.value ?? "that"), tekrar: m.yardim, bitir: false });
      return yanit({ soz: m.cal(r.name), directives: [calDirektifi(r)], bitir: true });
    }
    case "SimdiNeCaliyorIntent": {
      const r = liste.find((x) => x.slug === sonToken);
      if (!r) return yanit({ soz: m.sessiz, bitir: true });
      const c = await simdiCalan(r.slug);
      if (!c?.title) return yanit({ soz: m.bilinmiyor(r.name), bitir: true });
      return yanit({ soz: c.artist ? m.calan(r.name, c.artist, c.title) : m.calanSarki(r.name, c.title), bitir: true });
    }
    case "AMAZON.NextIntent":
      return yanit({ directives: [calDirektifi(sonraki(1))], bitir: true });
    case "AMAZON.PreviousIntent":
      return yanit({ directives: [calDirektifi(sonraki(-1))], bitir: true });
    case "AMAZON.ResumeIntent":
      return yanit({ directives: [calDirektifi(sonraki(0) ?? liste[0])], bitir: true });
    case "AMAZON.PauseIntent":
    case "AMAZON.StopIntent":
    case "AMAZON.CancelIntent":
      return yanit({ directives: [durDirektifi], bitir: true });
    case "AMAZON.HelpIntent":
      return yanit({ soz: m.yardim, tekrar: m.yardim, bitir: false });
    // Canlı radyoda başa sarma, karıştırma, tekrar yok: kibarca geç.
    case "AMAZON.LoopOnIntent": case "AMAZON.LoopOffIntent": case "AMAZON.ShuffleOnIntent":
    case "AMAZON.ShuffleOffIntent": case "AMAZON.StartOverIntent": case "AMAZON.RepeatIntent":
      return yanit({ bitir: true });
    default:
      return yanit({ soz: m.anlamadim, tekrar: m.yardim, bitir: false });
  }
}
