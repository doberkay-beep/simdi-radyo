import { ImageResponse } from "next/og";
import { senkronAl, yayilma, trZaman } from "@/lib/senkron";
import { BOYUT, boyutAl, RENK, kes, fontlar, KART_ONBELLEK, zemin, STORY_DOLGU } from "@/lib/kart-ortak";

// ⚡ SENKRON KARTI — "N radyo, aynı anda, birbirinden habersiz".
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const an = await senkronAl(Number(id));
  if (!an) return new Response("senkron anı bulunamadı", { status: 404 });

  const b = boyutAl(req);
  const { w, h } = BOYUT[b];
  const og = b === "og", story = b === "story";
  const saat = (t: string) =>
    new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(t));
  const liste = an.istasyonlar.slice(0, og ? 3 : story ? 6 : 5);

  const kart = (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: og ? "row" : "column",
      justifyContent: "space-between", alignItems: og ? "center" : "stretch",
      ...zemin(og), color: RENK.metin, fontFamily: "Govde",
      padding: og ? "56px 72px" : story ? STORY_DOLGU : "96px 90px 84px",
    }}>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: og ? 600 : "100%" }}>
        <div style={{ display: "flex", fontSize: og ? 22 : 30, letterSpacing: 8, color: RENK.sicak }}>⚡ SENKRON ANI</div>
        <div style={{ display: "flex", alignItems: "flex-end", marginTop: og ? 12 : 26 }}>
          <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 130 : story ? 300 : 240, lineHeight: 0.95, color: RENK.sicak, letterSpacing: -6 }}>
            {an.sayi}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 22, marginBottom: og ? 12 : 30 }}>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 40 : 64 }}>radyo,</div>
            <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 40 : 64 }}>aynı anda</div>
          </div>
        </div>
        <div style={{ display: "flex", fontFamily: "Siir", fontSize: og ? 26 : 38, color: RENK.soluk, marginTop: og ? 10 : 18 }}>
          birbirinden habersiz, {yayilma(an)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: og ? "flex-end" : "flex-start", marginTop: og ? 0 : 30, maxWidth: og ? 460 : "100%" }}>
        <div style={{ display: "flex", fontFamily: "Baslik", fontSize: og ? 40 : story ? 76 : 64, lineHeight: 1.05, textAlign: og ? "right" : "left" }}>
          {kes(an.title, 34)}
        </div>
        <div style={{ display: "flex", fontSize: og ? 26 : 40, color: RENK.soluk, marginTop: 8 }}>{kes(an.artist, 36)}</div>
        {!og && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
            {liste.map((s) => (
              <div key={s.slug} style={{ display: "flex", fontSize: 30, marginBottom: 12, color: RENK.metin }}>
                <span style={{ color: RENK.sicak, marginRight: 18 }}>{saat(s.t)}</span>
                {kes(s.name, 30)}
              </div>
            ))}
          </div>
        )}
      </div>

      {!og && (
        <div style={{ display: "flex", flexDirection: "column", borderTop: `2px solid ${RENK.cizgi}`, paddingTop: 34 }}>
          <div style={{ display: "flex", fontSize: 30, color: RENK.soluk }}>{trZaman(an.ilk)}</div>
          <div style={{ display: "flex", fontSize: 34, letterSpacing: 4, color: RENK.sicak, marginTop: 8 }}>necaliyor.co/senkron</div>
        </div>
      )}
    </div>
  );

  return new ImageResponse(kart, { width: w, height: h, fonts: await fontlar(), headers: KART_ONBELLEK });
}
