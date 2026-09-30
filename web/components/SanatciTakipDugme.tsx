"use client";

import { useEffect, useState } from "react";
import { izlenenOku, izlenenDegistir, izleniyorMu } from "@/lib/avlar";
import { radarAc, radarAcikMi, radarDestekleniyor, radarEsitle } from "@/lib/radar";
import { KASA_OLAYI } from "@/lib/kasa";
import KurSihirbazi, { kuruluMu } from "./KurSihirbazi";

// 🔔 Sanatçı sayfasının takip düğmesi — Google'dan gelen ziyaretçiyi
// takipçiye çevirir. Ana sayfadaki Sanatçı Takip ile aynı defter + radar.
export default function SanatciTakipDugme({ ad }: { ad: string }) {
  const [takipte, setTakipte] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [kurAcik, setKurAcik] = useState(false);

  useEffect(() => {
    const bak = () => setTakipte(izleniyorMu(izlenenOku(), ad));
    bak();
    window.addEventListener(KASA_OLAYI, bak);
    return () => window.removeEventListener(KASA_OLAYI, bak);
  }, [ad]);

  const iosKurulmamis = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !kuruluMu();

  const tikla = async () => {
    const yeni = izlenenDegistir(ad);
    const simdi = izleniyorMu(yeni, ad);
    setTakipte(simdi);
    window.dispatchEvent(new Event(KASA_OLAYI)); // sayfadaki diğer takip düğmesi de tazelensin
    radarEsitle().catch(() => {});
    if (!simdi) { setMesaj(""); return; }
    if (radarAcikMi()) { setMesaj(`Tamam — ${ad} bir radyoda çaldığı an haberin olacak.`); return; }
    if (iosKurulmamis()) { setMesaj("iPhone'da bildirim için önce ŞİMDİ'yi ana ekrana kur."); setKurAcik(true); return; }
    if (!radarDestekleniyor()) { setMesaj("Takiptesin. Bu tarayıcı bildirim alamıyor; ŞİMDİ açıkken bant düşer."); return; }
    const s = await radarAc();
    setMesaj(
      s === "acik" ? `🔔 Tamam — ${ad} bir radyoda çaldığı an telefonuna düşecek.`
      : s === "izin-yok" ? "Takiptesin, ama bildirim izni verilmedi — tarayıcı ayarlarından açabilirsin."
      : "Takiptesin. Bildirimler şu an açılamadı, sonra yeniden dene.",
    );
  };

  return (
    <div className="mt-4">
      <button
        onClick={tikla}
        className={`press ${takipte ? "" : "hap-marka"} rounded-full px-5 py-2.5 text-sm font-bold`}
        style={takipte ? { background: "linear-gradient(180deg, var(--glow-hi), var(--glow))", color: "var(--bg)" } : undefined}
        aria-pressed={takipte}
      >
        {takipte ? "✓ takiptesin — radyoda çalınca haber gelir" : "🔔 takip et — radyoda çalınca haber al"}
      </button>
      {mesaj && <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{mesaj}</p>}
      <KurSihirbazi acik={kurAcik} kapat={() => setKurAcik(false)} dil="tr" />
    </div>
  );
}
