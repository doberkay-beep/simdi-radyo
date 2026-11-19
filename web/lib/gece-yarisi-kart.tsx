import { ImageResponse } from "next/og";
import { fontlar, RENK } from "./kart-ortak";
import { guncelYil } from "./gece-yarisi";

// "Gece yarısı ne çalıyordu?" paylaşım kartı (1200×630). Saat çizgisi: katalogdaki gece yarısı
// anları (İstanbul saatiyle 31 Ara 16:00 → 1 Oca 11:00), ilki kızıl.
const ANLAR = [16, 16.5, 18, 19, 20, 21.5, 22, 23, 24, 25, 26, 27, 30, 32, 33, 35]; // İstanbul saati, 31 Ara 00:00'dan

const METIN = {
  tr: { ust: "nowby. · yılbaşı gecesi", b1: "Gece yarısı", b2: "ne çalıyordu?", alt: "Yüzlerce radyoda, yerel saatle 00:00'da çalan şarkı.", bas: "Sydney", son: "Los Angeles" },
  en: { ust: "nowby. · new year's eve", b1: "What was playing", b2: "at midnight?", alt: "The song on air at local 00:00, on hundreds of stations.", bas: "Sydney", son: "Los Angeles" },
};

export const KART_BOYUT = { width: 1200, height: 630 };

export async function geceYarisiKarti(dil: "tr" | "en") {
  const m = METIN[dil];
  const yil = guncelYil();
  const ilk = ANLAR[0], sonA = ANLAR[ANLAR.length - 1];
  const x = (s: number) => ((s - ilk) / (sonA - ilk)) * 100;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          padding: "64px 80px 58px", color: RENK.metin, fontFamily: "Baslik",
          backgroundColor: RENK.zemin1,
          backgroundImage: "radial-gradient(ellipse 900px 380px at 50% 0%, rgba(229,56,44,0.16), rgba(10,10,10,0) 70%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Govde", fontSize: 26, color: RENK.soluk, letterSpacing: 1 }}>
          <span>{m.ust}</span>
          <div style={{ display: "flex" }}>
            <span>{`${yil - 1} –`}</span>
            <span style={{ color: RENK.kor, marginLeft: 12 }}>{String(yil)}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 46, fontSize: 104, lineHeight: 1.02, letterSpacing: -2 }}>
          <span>{m.b1}</span>
          <span style={{ fontFamily: "Siir", fontStyle: "italic", color: RENK.kor }}>{m.b2}</span>
        </div>

        <div style={{ display: "flex", fontFamily: "Siir", fontStyle: "italic", fontSize: 30, color: RENK.soluk, marginTop: 26 }}>{m.alt}</div>

        {/* Saat çizgisi: gece yarısı dünyayı doğudan batıya dolaşır */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", position: "relative", height: 22 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 10, height: 2, backgroundColor: RENK.cizgi }} />
            {ANLAR.map((s, i) => (
              <div
                key={s}
                style={{
                  position: "absolute", left: `${x(s)}%`, top: i === 0 ? 2 : 6,
                  width: i === 0 ? 18 : 10, height: i === 0 ? 18 : 10, marginLeft: i === 0 ? -9 : -5,
                  borderRadius: 999, backgroundColor: i === 0 ? RENK.kor : RENK.metin, opacity: i === 0 ? 1 : 0.55,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: "Govde", fontSize: 24, color: RENK.soluk }}>
            <span style={{ display: "flex" }}><span style={{ color: RENK.metin, marginRight: 10 }}>00:00</span>{m.bas}</span>
            <span style={{ display: "flex" }}>{m.son}<span style={{ color: RENK.metin, marginLeft: 10 }}>00:00</span></span>
          </div>
        </div>
      </div>
    ),
    { ...KART_BOYUT, fonts: await fontlar() },
  );
}
