import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import { BOYUT, boyutAl, RENK, kes, fontlar, KART_ONBELLEK, zemin, STORY_DOLGU } from "@/lib/kart-ortak";

// Paylaşım kartları — Instagram/X için kalıcı adresler:
//   /kart/tanisma · /kart/nasil · /kart/rekorlar · /kart/gece   (?boyut=post|story|og)
// Veri içerenler (rekorlar, gece) canlıdan üretilir; saatlik önbellek.

const TURLER = ["tanisma", "nasil", "rekorlar", "gece", "duyuru", "endeks"] as const;
type Tur = (typeof TURLER)[number];

// Marka işareti: sinyal çubukları (kor → krem) — profil resmiyle aynı.
function Sinyal({ olcek = 1 }: { olcek?: number }) {
  const boy = [30, 42, 56, 38, 48], renk = ["#e5382c", "#ee5a3f", "#ff9b76", "#f6b896", "#f2e6da"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: 56 * olcek }}>
      {boy.map((h, i) => (
        <div key={i} style={{ display: "flex", width: 8 * olcek, height: h * olcek, borderRadius: 4 * olcek, background: renk[i], marginRight: i < 4 ? 6 * olcek : 0 }} />
      ))}
    </div>
  );
}

function Alt({ adres }: { adres: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `2px solid ${RENK.cizgi}`, paddingTop: 30 }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 32, letterSpacing: 4, color: RENK.sicak }}>{adres}</div>
        <div style={{ display: "flex", fontFamily: "Siir", fontSize: 26, color: RENK.soluk, marginTop: 8 }}>bir yazarın radyo projesi</div>
      </div>
      <Sinyal olcek={1.1} />
    </div>
  );
}

type Rekor = { artist: string; title: string; kez?: number; istasyon?: number | string; gun?: string };
type Rekorlar = { gunRekoru: Rekor | null; geceKrali: Rekor | null; sabahSampiyonu: Rekor | null; genisYayilim: Rekor | null; sadikIliski: Rekor | null };

async function govde(tur: Tur, og: boolean, ay: string | null) {
  const sb = getSupabase();
  if (tur === "duyuru") {
    // Kişisel hesaptan paylaşılacak "yeni hesap" duyurusu — alt bölüm boş kalır,
    // Instagram'da @bahsetme ya da bağlantı etiketi oraya konur.
    const satirlar = [
      ["📊", "radyoların gerçek listesi"],
      ["📰", "her ay Türkiye Radyo Endeksi"],
      ["⚡", "senkron anları ve rekorlar"],
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <Sinyal olcek={og ? 1.4 : 2.4} />
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: RENK.sicak, marginTop: og ? 24 : 60 }}>YENİ HESAP</div>
        <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 84 : 124, letterSpacing: -3, marginTop: 10 }}>@necaliyor.co</div>
        <div style={{ display: "flex", fontFamily: "Siir", fontSize: og ? 32 : 46, color: RENK.soluk, marginTop: og ? 14 : 28, lineHeight: 1.3 }}>
          Türk radyolarında şu an ne çalıyor? Biz sayıyoruz.
        </div>
        {!og && satirlar.map(([ik, m]) => (
          <div key={m} style={{ display: "flex", alignItems: "center", marginTop: 34 }}>
            <div style={{ display: "flex", fontSize: 40, width: 70 }}>{ik}</div>
            <div style={{ display: "flex", fontSize: 40 }}>{m}</div>
          </div>
        ))}
      </div>
    );
  }
  if (tur === "endeks") {
    const hedef = ay && /^\d{4}-\d{2}$/.test(ay) ? ay : null;
    const { data } = await sb.rpc("endeks_ozet", { p_ay: hedef ?? "2026-09" });
    const o = data as { ay: string; toplam: number; sanatci: { ad: string } | null; liste: { artist: string; title: string; kez: number; istasyon: number }[] } | null;
    if (!o?.liste?.length) throw new Error("endeks verisi gelmedi");
    const [yy, mm] = o.ay.split("-").map(Number);
    const ayAdi = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "Europe/Istanbul" })
      .format(new Date(Date.UTC(yy, mm - 1, 15))).toLocaleUpperCase("tr");
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 8, color: RENK.sicak }}>TÜRKİYE RADYO ENDEKSİ</div>
        <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 104, letterSpacing: -2, marginTop: 10 }}>{ayAdi}</div>
        <div style={{ display: "flex", marginTop: 26 }}>
          {[[Number(o.toplam).toLocaleString("tr-TR"), "kayıtlı çalma"], [o.sanatci?.ad ?? "—", "ayın sanatçısı"]].map(([d1, d2]) => (
            <div key={d2} style={{ display: "flex", flexDirection: "column", marginRight: 60 }}>
              <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 54, color: RENK.sicak }}>{kes(d1, 14)}</div>
              <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: RENK.soluk }}>{d2.toLocaleUpperCase("tr")}</div>
            </div>
          ))}
        </div>
        {o.liste.slice(0, 5).map((x, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", marginTop: 34 }}>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 52, color: i < 3 ? RENK.sicak : RENK.soluk, width: 80 }}>{i + 1}</div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 46 }}>{kes(x.title, 26)}</div>
              <div style={{ display: "flex", fontSize: 30, color: RENK.soluk }}>{kes(x.artist, 32)}</div>
            </div>
            <div style={{ display: "flex", fontSize: 28, color: RENK.soluk }}>{x.kez} kez</div>
          </div>
        ))}
      </div>
    );
  }
  if (tur === "tanisma") {
    const { count } = await sb.from("stations").select("id", { count: "exact", head: true }).eq("is_active", true);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <Sinyal olcek={og ? 1.4 : 2.2} />
        <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 76 : 112, lineHeight: 1.02, letterSpacing: -2, marginTop: og ? 30 : 56 }}>
          Türk radyolarında şu an ne çalıyor?
        </div>
        <div style={{ display: "flex", fontFamily: "Siir", fontSize: og ? 32 : 46, color: RENK.soluk, marginTop: og ? 18 : 36, lineHeight: 1.3 }}>
          Biz dinliyoruz. {count ?? 350} radyo, 25 saniyede bir, her şarkı kayıt altında.
        </div>
      </div>
    );
  }
  if (tur === "nasil") {
    const adimlar = [
      ["01", "Dinliyoruz", "Türkiye'nin ve dünyanın radyolarını 7/24, 25 saniyede bir."],
      ["02", "Yazıyoruz", "Her şarkı değişimi arşive düşer. Jingle, reklam, kopya yayın elenir."],
      ["03", "Sayıyoruz", "Canlı liste, aylık Türkiye Radyo Endeksi, rekorlar, senkron anları."],
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: RENK.sicak }}>NASIL ÇALIŞIYOR?</div>
        {adimlar.map(([no, bas, ac]) => (
          <div key={no} style={{ display: "flex", marginTop: 54 }}>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 64, color: RENK.sicak, width: 120 }}>{no}</div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 64 }}>{bas}</div>
              <div style={{ display: "flex", fontSize: 32, color: RENK.soluk, marginTop: 10, lineHeight: 1.35 }}>{ac}</div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", fontFamily: "Siir", fontSize: 34, color: RENK.metin, marginTop: 60 }}>Anket değil, gerçek sayım. Üyelik yok, ücret yok.</div>
      </div>
    );
  }
  if (tur === "rekorlar") {
    const { data } = await sb.rpc("rekorlar");
    const r = data as Rekorlar | null;
    if (!r) throw new Error("rekorlar verisi gelmedi");
    const satir: [string, Rekor | null | undefined, (x: Rekor) => string][] = [
      ["⚡ BİR GÜNÜN REKORU", r?.gunRekoru, (x) => `tek günde ${x.kez} kez`],
      ["🌙 GECENİN KRALI", r?.geceKrali, (x) => `30 gecede ${x.kez} kez`],
      ["☀️ SABAHIN ŞAMPİYONU", r?.sabahSampiyonu, (x) => `30 sabahta ${x.kez} kez`],
      ["📡 EN GENİŞ YAYILIM", r?.genisYayilim, (x) => `${x.istasyon} farklı radyoda`],
      ["💘 EN SADIK İLİŞKİ", r?.sadikIliski, (x) => `${x.istasyon}: ${x.kez} kez`],
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 96, letterSpacing: -2 }}>Radyo Rekorları</div>
        <div style={{ display: "flex", fontFamily: "Siir", fontSize: 36, color: RENK.soluk, marginTop: 10 }}>son 30 günün uç değerleri — türk radyoları</div>
        {satir.filter(([, x]) => x).map(([et, x, alt]) => (
          <div key={et} style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: RENK.sicak }}>{et}</div>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 44, marginTop: 6 }}>{kes(`${x!.artist} — ${x!.title}`, 34)}</div>
            <div style={{ display: "flex", fontSize: 28, color: RENK.soluk, marginTop: 4 }}>{alt(x!)}</div>
          </div>
        ))}
      </div>
    );
  }
  // gece
  const { data } = await sb.rpc("gece_listesi", { adet: 7 });
  const liste = (data as { artist: string; title: string; kez: number; istasyon: number }[] | null) ?? [];
  if (!liste.length) throw new Error("gece listesi verisi gelmedi");
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
      <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: RENK.sicak }}>🌙 02:00 – 05:00 · SON 7 GECE</div>
      <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 104, letterSpacing: -2, marginTop: 14 }}>Gece 3 Listesi</div>
      <div style={{ display: "flex", fontFamily: "Siir", fontSize: 36, color: RENK.soluk, marginTop: 10 }}>şehir uyurken radyolar bunu çaldı</div>
      {liste.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", marginTop: 30 }}>
          <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 44, color: i < 3 ? RENK.sicak : RENK.soluk, width: 70 }}>{i + 1}</div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: 40 }}>{kes(s.title, 30)}</div>
            <div style={{ display: "flex", fontSize: 28, color: RENK.soluk }}>{kes(s.artist, 36)}</div>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: RENK.soluk }}>{s.kez} kez</div>
        </div>
      ))}
    </div>
  );
}

const ADRES: Record<Tur, string> = {
  tanisma: "necaliyor.co", nasil: "necaliyor.co", rekorlar: "necaliyor.co/rekorlar", gece: "necaliyor.co/gece",
  duyuru: "instagram.com/necaliyor.co", endeks: "necaliyor.co/endeks",
};

export async function GET(req: Request, ctx: { params: Promise<{ tur: string }> }) {
  const { tur } = await ctx.params;
  if (!TURLER.includes(tur as Tur)) return new Response("kart yok", { status: 404 });
  const b = boyutAl(req);
  const { w, h } = BOYUT[b];
  const og = b === "og";
  // Veri gelmezse boş kart ÜRETME: 503 + önbelleğe yazma (CDN bir saat boş kart saklamasın).
  let icerik;
  try {
    icerik = await govde(tur as Tur, og, new URL(req.url).searchParams.get("ay"));
  } catch {
    return new Response("veri şu an alınamadı, birazdan yine dene", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const kart = (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      ...zemin(og), color: RENK.metin, fontFamily: "Govde",
      padding: og ? "50px 72px" : b === "story" ? STORY_DOLGU : "90px 90px 80px",
    }}>
      {icerik}
      {!og && <Alt adres={ADRES[tur as Tur]} />}
    </div>
  );
  return new ImageResponse(kart, { width: w, height: h, fonts: await fontlar(), headers: KART_ONBELLEK });
}
