import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import { BOYUT, boyutAl, RENK, kes, fontlar, KART_ONBELLEK, zemin, STORY_DOLGU } from "@/lib/kart-ortak";

// 📻 İSTASYON ROZETİ — radyonun haftalık karnesi: kaç farklı şarkı, en sevdiği
// şarkı ve sanatçılar. Ton sevecen ("en sevdiği"), asla alaycı değil: radyolar
// bunu kendi hesaplarında gururla paylaşsın.
type Ozet = {
  ad: string;
  kez7: number;
  farkliSarki: number;
  farkliSanatci: number;
  sarki: { artist: string; title: string; kez: number } | null;
  sanatcilar: { ad: string; kez: number }[];
};

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const { data } = await getSupabase().rpc("istasyon_ozet", { p_slug: slug });
  const o = data as Ozet | null;
  if (!o || !o.kez7) return new Response("istasyon ya da haftalık veri yok", { status: 404 });

  const b = boyutAl(req);
  const { w, h } = BOYUT[b];
  const og = b === "og", story = b === "story";
  const adBoy = og ? (o.ad.length > 16 ? 56 : 72) : o.ad.length > 16 ? 84 : 112;

  const kart = (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: og ? "row" : "column",
      justifyContent: "space-between", alignItems: og ? "center" : "stretch",
      ...zemin(og), color: RENK.metin, fontFamily: "Govde",
      padding: og ? "56px 72px" : story ? STORY_DOLGU : "96px 90px 84px",
    }}>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: og ? 560 : "100%" }}>
        <div style={{ display: "flex", fontSize: og ? 22 : 30, letterSpacing: 8, color: RENK.sicak }}>📻 SON 7 GÜNDE</div>
        <div style={{ display: "flex", fontFamily: "Baslik", fontSize: adBoy, lineHeight: 1.02, marginTop: og ? 16 : 28, letterSpacing: -2 }}>
          {kes(o.ad, 26)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: og ? "flex-end" : "flex-start", marginTop: og ? 0 : 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 130 : story ? 280 : 230, lineHeight: 0.95, color: RENK.sicak, letterSpacing: -6 }}>
            {o.farkliSarki.toLocaleString("tr-TR")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 20, marginBottom: og ? 10 : 26 }}>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 36 : 58 }}>farklı</div>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 36 : 58 }}>şarkı</div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: og ? 24 : 36, marginTop: 6 }}>
          {o.farkliSanatci} sanatçı · {o.kez7.toLocaleString("tr-TR")} çalma
        </div>
        {o.sarki && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: og ? 14 : 40, alignItems: og ? "flex-end" : "flex-start" }}>
            <div style={{ display: "flex", fontSize: og ? 20 : 28, letterSpacing: 5, color: RENK.soluk }}>EN SEVDİĞİ ŞARKI</div>
            <div style={{ display: "flex", fontFamily: "Siir", fontSize: og ? 30 : 46, marginTop: 8 }}>
              “{kes(o.sarki.title, 28)}” — {kes(o.sarki.artist, 22)}
            </div>
          </div>
        )}
        {!og && o.sanatcilar.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 30 }}>
            {o.sanatcilar.map((s) => (
              <div key={s.ad} style={{ display: "flex", fontSize: 28, padding: "12px 22px", marginRight: 14, marginBottom: 14, borderRadius: 999, border: `2px solid ${RENK.cizgi}`, color: RENK.soluk }}>
                {kes(s.ad, 20)} · {s.kez}
              </div>
            ))}
          </div>
        )}
      </div>

      {!og && (
        <div style={{ display: "flex", flexDirection: "column", borderTop: `2px solid ${RENK.cizgi}`, paddingTop: 34 }}>
          <div style={{ display: "flex", fontSize: 34, letterSpacing: 4, color: RENK.sicak }}>necaliyor.co/radyo/{kes(slug, 22)}</div>
          <div style={{ display: "flex", fontFamily: "Siir", fontSize: 28, color: RENK.soluk, marginTop: 10 }}>
            ŞİMDİ · radyonun haftalık karnesi — canlı arşivden
          </div>
        </div>
      )}
    </div>
  );

  return new ImageResponse(kart, { width: w, height: h, fonts: await fontlar(), headers: KART_ONBELLEK });
}
