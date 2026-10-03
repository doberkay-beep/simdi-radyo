import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import { BOYUT, boyutAl, RENK, kes, fontlar, KART_ONBELLEK, zemin, STORY_DOLGU } from "@/lib/kart-ortak";

// 📻 RADYO ROZETİ — sanatçının "bu hafta Türkiye radyolarında N kez çaldım"
// kartı. Sanatçı/menajer story'sinde paylaşsın diye: kendi kitlesini ŞİMDİ'ye taşır.
//   ?boyut=post  1080×1350 (varsayılan, IG/X gönderisi)
//   ?boyut=story 1080×1920 (IG story)
//   ?boyut=og    1200×630  (link önizlemesi — sanatçı sayfasının og:image'ı)

type Ozet = {
  ad: string;
  kez7: number;
  kez30: number;
  istasyonSay: number;
  istasyonSay7?: number;
  sarkilar: { title: string; kez: number }[];
  sarkilar7?: { title: string; kez: number }[];
  istasyonlar: { name: string; kez: number }[];
  istasyonlar7?: { name: string; kez: number }[];
};


export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const b = boyutAl(req);
  const { w, h } = BOYUT[b];
  const og = b === "og";
  const story = b === "story";

  const { data } = await getSupabase().rpc("sanatci_ozet", { p_slug: slug });
  const o = data as Ozet | null;
  if (!o) return new Response("sanatçı bulunamadı", { status: 404 });

  // Bu hafta çaldıysa haftalık, yoksa aylık — ama kartın BÜTÜN sayıları aynı
  // dönemden gelir (haftalık kırılım yoksa dürüstçe 30 güne düşülür).
  const haftalik = o.kez7 > 0 && o.istasyonSay7 !== undefined;
  const sayi = haftalik ? o.kez7 : o.kez30;
  const donem = haftalik ? "BU HAFTA" : "SON 30 GÜNDE";
  const istasyonSay = haftalik ? o.istasyonSay7! : o.istasyonSay;
  const zirve = (haftalik ? o.sarkilar7 : o.sarkilar)?.[0];
  const istasyonlar = ((haftalik ? o.istasyonlar7 : o.istasyonlar) ?? []).slice(0, story ? 4 : 3);


  // Ölçek: og yatay ve alçak; post/story dikey.
  const adBoy = og ? (o.ad.length > 16 ? 60 : 78) : o.ad.length > 16 ? 92 : 120;
  const sayiBoy = og ? 150 : story ? 320 : 260;

  const kart = (
    <div
      style={{
        width: "100%", height: "100%", display: "flex", flexDirection: og ? "row" : "column",
        justifyContent: "space-between", alignItems: og ? "center" : "stretch",
        ...zemin(og),
        color: RENK.metin, fontFamily: "Govde",
        padding: og ? "56px 72px" : story ? STORY_DOLGU : "96px 90px 84px",
      }}
    >
      {/* Üst: künye + sanatçı */}
      <div style={{ display: "flex", flexDirection: "column", maxWidth: og ? 560 : "100%" }}>
        <div style={{ display: "flex", fontSize: og ? 22 : 30, letterSpacing: 8, color: RENK.sicak }}>
          📻 TÜRKİYE RADYOLARINDA
        </div>
        <div style={{ display: "flex", fontFamily: "Baslik", fontSize: adBoy, lineHeight: 1.02, marginTop: og ? 18 : 30, letterSpacing: -2 }}>
          {kes(o.ad, 28)}
        </div>
        {zirve && (
          <div style={{ display: "flex", fontFamily: "Siir", fontSize: og ? 28 : 40, color: RENK.soluk, marginTop: og ? 14 : 24 }}>
            en çok: “{kes(zirve.title, 30)}”
          </div>
        )}
      </div>

      {/* Orta: dev sayı */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: og ? "flex-end" : "flex-start", marginTop: og ? 0 : 20 }}>
        <div style={{ display: "flex", fontSize: og ? 24 : 34, letterSpacing: 6, color: RENK.soluk }}>{donem}</div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontFamily: "Baslik", fontSize: sayiBoy, lineHeight: 0.95, color: RENK.sicak, letterSpacing: -6 }}>
            {sayi}
          </div>
          <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 44 : 72, marginLeft: 18, marginBottom: og ? 14 : 28 }}>
            kez
          </div>
        </div>
        <div style={{ display: "flex", fontSize: og ? 26 : 38, color: RENK.metin, marginTop: 6 }}>
          {istasyonSay} istasyonda çalındı
        </div>
        {!og && istasyonlar.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 34 }}>
            {istasyonlar.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex", fontSize: 28, padding: "12px 22px", marginRight: 14, marginBottom: 14,
                  borderRadius: 999, border: `2px solid ${RENK.cizgi}`, color: RENK.soluk,
                }}
              >
                {kes(s.name, 22)} · {s.kez}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alt: imza */}
      {!og && (
        <div style={{ display: "flex", flexDirection: "column", borderTop: `2px solid ${RENK.cizgi}`, paddingTop: 34 }}>
          <div style={{ display: "flex", fontSize: 34, letterSpacing: 4, color: RENK.sicak }}>
            necaliyor.co/sanatci/{kes(slug, 24)}
          </div>
          <div style={{ display: "flex", fontFamily: "Siir", fontSize: 28, color: RENK.soluk, marginTop: 10 }}>
            ŞİMDİ · canlı radyo sayacı — gerçek sayım, anket değil
          </div>
        </div>
      )}
    </div>
  );

  return new ImageResponse(kart, {
    width: w,
    height: h,
    fonts: await fontlar(),
    headers: KART_ONBELLEK,
  });
}
