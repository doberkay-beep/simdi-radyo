"use client";

import { useEffect, useRef, useState } from "react";
import { kaynagiCalistir, hlsYik } from "@/lib/cal";
import { KARE_DK, YIL_SAHNESI_DK, type Kare } from "@/lib/yilin-kareleri";

/* YILIN ON İKİ KARESİ — gece yarısı ekranında, izleyicinin yerel saatiyle 23:12'den itibaren
 * 2026'nın on iki ayı birer kare olarak akar; 00:00'da yalnız yeni yıl ve arkada canlı radyo kalır.
 * frameby galeri dili "C": kare tam ekran, altta hafif karartma, köşede yer adı büyük Bodoni,
 * altında ay/saat; cam hapta canlı radyo + şarkı. Ses her zaman canlı yayın, kayıt yok. */

type Dil = "tr" | "en";
const AYLAR = {
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const M = {
  tr: { baslik: "Yılın on iki karesi", foto: "fotoğraf", dinle: "dinle", durdur: "durdur", canli: "canlı", tam: "tam ekran", kapat: "listeye dön", baglanti: "frameby. — ekranında yavaşça akan şehir kareleri" },
  en: { baslik: "Twelve frames of the year", foto: "photo", dinle: "listen", durdur: "stop", canli: "live", tam: "full screen", kapat: "back to the list", baglanti: "frameby. — city frames drifting slowly across your screen" },
};

type Calan = { ad: string; artist: string | null; title: string | null } | null;

export function karelerEvresi(simdi: number, geceYarisi: number) {
  const bas = geceYarisi - 12 * KARE_DK * 60000;
  if (simdi < bas) return { evre: "once" as const, sira: -1, bas };
  if (simdi < geceYarisi) return { evre: "kareler" as const, sira: Math.min(11, Math.floor((simdi - bas) / (KARE_DK * 60000))), bas };
  if (simdi < geceYarisi + YIL_SAHNESI_DK * 60000) return { evre: "yil" as const, sira: 12, bas };
  return { evre: "sonra" as const, sira: -1, bas };
}

export default function YilinKareleri({
  kareler, dil, simdi, geceYarisi, yil, onKapat,
}: { kareler: Kare[]; dil: Dil; simdi: number; geceYarisi: number; yil: number; onKapat?: () => void }) {
  const m = M[dil];
  const { evre, sira } = karelerEvresi(simdi, geceYarisi);
  const kare = sira >= 0 && sira < 12 ? kareler[sira] : null;
  // 00:00'da: son karenin (Aralık) radyosu çalmaya devam eder.
  const radyo = (kare ?? kareler[11])?.radyo;
  const sahneRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [caliyor, setCaliyor] = useState<"yok" | "baglaniyor" | "caliyor">("yok");
  const [calan, setCalan] = useState<Calan>(null);
  const caliyorRadyo = useRef<string | null>(null);

  // Hapta şu an çalan (Hetzner anlık dosyası üzerinden /api/now, CDN 3 sn) — 20 sn'de bir.
  useEffect(() => {
    if (!radyo) return;
    let iptal = false;
    const sor = async () => {
      try {
        const r = await fetch(`/api/now?s=${radyo}`);
        const d = await r.json();
        const s = (d.stations ?? []).find((x: { slug: string }) => x.slug === radyo);
        if (!iptal) setCalan(s ? { ad: s.name, artist: s.nowPlaying?.artist ?? null, title: s.nowPlaying?.title ?? null } : null);
      } catch { /* sonraki tur */ }
    };
    sor();
    const t = setInterval(sor, 20_000);
    return () => { iptal = true; clearInterval(t); };
  }, [radyo]);

  // Kare değişince radyo da değişir: dinleyen varsa yeni karenin radyosuna geçilir.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !radyo || caliyorRadyo.current === null || caliyorRadyo.current === radyo) return;
    caliyorRadyo.current = radyo;
    setCaliyor("baglaniyor");
    hlsYik(a);
    kaynagiCalistir(a, radyo).catch(() => setCaliyor("yok"));
  }, [radyo]);

  function dinle() {
    const a = audioRef.current;
    if (!a || !radyo) return;
    if (caliyor !== "yok") { a.pause(); hlsYik(a); caliyorRadyo.current = null; setCaliyor("yok"); return; }
    caliyorRadyo.current = radyo;
    setCaliyor("baglaniyor");
    kaynagiCalistir(a, radyo).catch(() => setCaliyor("yok"));
  }

  function tamEkran() {
    const s = sahneRef.current;
    if (!s) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else s.requestFullscreen?.().catch(() => {});
  }

  if (evre === "once" || evre === "sonra") return null;

  return (
    <section className="yk" ref={sahneRef} aria-label={m.baslik}>
      {/* Kareler üst üste; yalnız sıradaki görünür, aralarında yavaş geçiş. */}
      {kareler.map((k, i) => (
        <div key={k.id} className={`yk-kare${i === sira ? " acik" : ""}${k.dikey ? " dikey" : ""}`} aria-hidden={i !== sira}>
          {k.dikey && <img className="yk-arka" src={k.gorsel} alt="" loading={Math.abs(i - sira) <= 1 ? "eager" : "lazy"} />}
          <img className="yk-gorsel" src={k.gorsel} alt={`${k.semt}, ${AYLAR[dil][k.ay - 1]} 2026`} loading={Math.abs(i - sira) <= 1 ? "eager" : "lazy"} />
        </div>
      ))}
      <div className={`yk-yil${evre === "yil" ? " acik" : ""}`} aria-hidden={evre !== "yil"}>
        <span>{yil}</span>
      </div>
      <div className="yk-karartma" />

      <div className={`yk-ust${evre === "yil" ? " sessiz" : ""}`}>
        <span className="yk-etiket">nowby. · {m.baslik}</span>
        <ol className="yk-cizgi" aria-hidden="true">
          {kareler.map((k, i) => <li key={k.id} className={i < sira ? "gecti" : i === sira ? "simdi" : ""} />)}
        </ol>
        <span className="yk-dugmeler">
          <button onClick={tamEkran}>{m.tam}</button>
          {onKapat && <button onClick={onKapat}>{m.kapat}</button>}
        </span>
      </div>

      {kare && (
        <div className="yk-yer" key={kare.id}>
          <p className="yk-semt">{kare.semt}</p>
          <p className="yk-ay">{AYLAR[dil][kare.ay - 1]} 2026 · {kare.saat}</p>
          {kare.fotografci && <p className="yk-foto">{m.foto}: {kare.fotografci}</p>}
        </div>
      )}

      <button className={`yk-hap ${caliyor}`} onClick={dinle} aria-label={caliyor === "yok" ? m.dinle : m.durdur}>
        <span className="yk-nokta" aria-hidden="true" />
        <span className="yk-hap-metin">
          <b>{calan?.ad ?? radyo}</b>
          {calan?.title && <span>{calan.title}{calan.artist ? ` — ${calan.artist}` : ""}</span>}
        </span>
        <span className="yk-hap-dugme">{caliyor === "yok" ? m.dinle : caliyor === "baglaniyor" ? "…" : m.durdur}</span>
      </button>
      <audio
        ref={audioRef}
        onPlaying={() => setCaliyor("caliyor")}
        onError={() => setCaliyor("yok")}
      />
      <a className={`yk-frameby${evre === "yil" ? " sessiz" : ""}`} href="https://www.berkaydogan.co/frameby">{m.baglanti}</a>
    </section>
  );
}
