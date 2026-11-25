"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GyVeri, GyGrup, GySatir } from "@/lib/gece-yarisi";
import { ULKELER, bayrakEmoji, type UlkeKodu } from "@/lib/ulkeler";
import { yilaEk } from "@/lib/yil-ek";
import YilinKareleri from "./YilinKareleri";
import type { Kare } from "@/lib/yilin-kareleri";

type Dil = "tr" | "en";

const METIN = {
  tr: {
    ust: "yılbaşı gecesi",
    baslik: "Gece yarısı ne çalıyordu?",
    giris: (n: number) =>
      `Dünya, saat dilimi saat dilimi yeni yıla girerken ${n} radyoda yerel saatle 00:00'da çalan şarkı. Biri sayarken, biri öpüşürken, biri yolda; radyo her yerde açıktı.`,
    arsivBaslik: (y: number) => `${yilaEk(y)} hangi şarkıyla girdik`,
    denemeBaslik: (t: string) => `${t} gecesi, yerel 00:00`,
    ilk: "İlk gece yarısına",
    sonraki: "Sıradaki gece yarısı",
    simdiGiren: "Şu an yeni güne giren",
    simdiGirenYil: "Şu an yeni yıla giren",
    istanbul: "İstanbul saatiyle",
    bekliyor: "Henüz gece yarısı olmadı.",
    hazirlaniyor: "Gece yarısı oldu; şarkılar arşivden toplanıyor…",
    okunamadi: "Arşiv şu an okunamadı; birazdan yine dene.",
    bos: "Bu gece yarısında şarkı bilgisi veren radyo olmadı.",
    sonra: "00:03'e kadar başladı",
    radyo: (n: number, m: number) => `${m} / ${n} radyo`,
    gun: "gün",
    dahasi: (n: number) => `ve ${n} ülke daha`,
    ozet: (r: number, u: number) => `${r} radyo · ${u} ülke`,
    dipnot:
      "Her radyonun saati kendi ülkesinin (birden çok saat dilimli ülkelerde şehrinin) saatidir. 00:00'da çalan şarkı; o an yayın bilgisi yoksa 00:00–00:03 arası başlayan ilk şarkı. Şarkıyı göstermek istemeyen radyolar listede yok.",
    canli: "Bütün radyolar, şu an →",
    canliHref: "/",
  },
  en: {
    ust: "new year's eve",
    baslik: "What was playing at midnight?",
    giris: (n: number) =>
      `As the world crossed into the new year, one time zone after another: the song on air at local 00:00 on ${n} radio stations. Someone counting down, someone kissing, someone on the road; the radio was on everywhere.`,
    arsivBaslik: (y: number) => `The songs that played us into ${y}`,
    denemeBaslik: (t: string) => `The night of ${t}, local 00:00`,
    ilk: "First midnight in",
    sonraki: "Next midnight in",
    simdiGiren: "Crossing into the new day now",
    simdiGirenYil: "Crossing into the new year now",
    istanbul: "Istanbul time",
    bekliyor: "Not midnight here yet.",
    hazirlaniyor: "It's midnight; gathering the songs from the archive…",
    okunamadi: "The archive couldn't be read just now; try again shortly.",
    bos: "No station sent song info at this midnight.",
    sonra: "started by 00:03",
    radyo: (n: number, m: number) => `${m} / ${n} stations`,
    gun: "d",
    dahasi: (n: number) => `and ${n} more countries`,
    ozet: (r: number, u: number) => `${r} stations · ${u} countries`,
    dipnot:
      "Each station keeps its own country's time (its city's, in countries with several time zones). The song on air at 00:00; if there was no song info at that moment, the first song that started between 00:00 and 00:03. Stations that prefer not to show their songs are left out.",
    canli: "All stations, right now →",
    canliHref: "/",
  },
};

function ulkeAdi(u: string, dil: Dil): string {
  const k = (ULKELER as Record<string, { tr: string; en: string }>)[u];
  if (k) return k[dil];
  try {
    return new Intl.DisplayNames([dil], { type: "region" }).of(u.toUpperCase()) ?? u.toUpperCase();
  } catch {
    return u.toUpperCase();
  }
}
const bayrak = (u: string) => (u === "www" ? "" : bayrakEmoji(u as UlkeKodu));

function yerAdi(y: { ulke: string; sehir: string | null }, dil: Dil) {
  return y.sehir ? `${ulkeAdi(y.ulke, dil)} · ${y.sehir}` : ulkeAdi(y.ulke, dil);
}

/** Aynı ülkenin şehirleri tek yerde: "Avustralya · Sydney, Hobart, Melbourne". */
function ulkeyeGore(yerler: { ulke: string; sehir: string | null }[]) {
  const m = new Map<string, string[]>();
  for (const y of yerler) {
    const l = m.get(y.ulke) ?? [];
    if (y.sehir) l.push(y.sehir);
    m.set(y.ulke, l);
  }
  return [...m.entries()].map(([ulke, s]) => ({ ulke, sehir: s.length ? s.join(", ") : null }));
}

function istanbulSaati(iso: string, dil: Dil) {
  return new Intl.DateTimeFormat(dil === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul",
  }).format(new Date(iso));
}

function sure(ms: number, dil: Dil) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const g = Math.floor(s / 86400);
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${g > 0 ? `${g} ${METIN[dil].gun} ` : ""}${hh}:${mm}:${ss}`;
}

export default function GeceYarisi({
  ilk, dil, sorgu, deneme, kareler,
}: { ilk: GyVeri; dil: Dil; sorgu: string; deneme: boolean; kareler?: Kare[] }) {
  const m = METIN[dil];
  const [veri, setVeri] = useState(ilk);
  // Sunucu saati kaydırılmışsa (yerel sınama) istemci saati de aynı farkla ilerler.
  const [fark] = useState(() => Date.parse(ilk.simdi) - Date.now());
  const [simdi, setSimdi] = useState(() => Date.parse(ilk.simdi));

  // Yerel geliştirmede ?hiz=60 saati 60 kat hızlandırır (Yılın on iki karesi önizlemesi için).
  const [hiz, setHiz] = useState(1);
  const [yerelGeceYarisi, setYerelGeceYarisi] = useState<number | null>(null);
  const [karelerKapali, setKarelerKapali] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const h = Number(new URLSearchParams(location.search).get("hiz"));
      if (h > 1 && h <= 600) setHiz(h);
    }
    // İzleyicinin kendi saatiyle gece yarısı (tarayıcının saat dilimi).
    const [y, a, g] = ilk.tarih.split("-").map(Number);
    setYerelGeceYarisi(new Date(y, a - 1, g).getTime());
  }, [ilk.tarih]);
  useEffect(() => {
    const bas = Date.now(), sunucu = bas + fark;
    const t = setInterval(() => setSimdi(hiz === 1 ? Date.now() + fark : sunucu + (Date.now() - bas) * hiz), hiz === 1 ? 1000 : 250);
    return () => clearInterval(t);
  }, [fark, hiz]);

  // Gece boyunca: gece yarısı geçmiş ama henüz hazır olmayan grup varsa dakikada bir yeniden sor.
  const bekleyen = veri.gruplar.some((g) => g.durum !== "hazir" && Date.parse(g.an) <= simdi);
  useEffect(() => {
    if (!bekleyen) return;
    let iptal = false;
    const sor = async () => {
      try {
        const q = new URLSearchParams(sorgu);
        if (fark !== 0) q.set("simdi", new Date(Date.now() + fark).toISOString());
        const r = await fetch(`/api/gece-yarisi?${q}`);
        if (r.ok && !iptal) setVeri(await r.json());
      } catch { /* sonraki turda */ }
    };
    const t = setInterval(sor, 60_000);
    return () => { iptal = true; clearInterval(t); };
  }, [bekleyen, sorgu, fark]);

  const yil = Number(veri.tarih.slice(0, 4));
  const gruplar = veri.gruplar;
  const ilkAn = gruplar.length ? Date.parse(gruplar[0].an) : 0;
  const sonAn = gruplar.length ? Date.parse(gruplar[gruplar.length - 1].an) : 0;
  const evre = simdi < ilkAn ? "once" : simdi < sonAn + 5 * 60000 ? "sirada" : "sonra";
  const simdiki = [...gruplar].reverse().find((g) => Date.parse(g.an) <= simdi) ?? null;
  const siradaki = gruplar.find((g) => Date.parse(g.an) > simdi) ?? null;

  const toplam = useMemo(() => {
    const radyo = gruplar.reduce((a, g) => a + g.satirlar.length, 0);
    const ulke = new Set(gruplar.flatMap((g) => g.satirlar.map((s) => s.ulke))).size;
    return { radyo, ulke, katalog: gruplar.reduce((a, g) => a + g.istasyon, 0) };
  }, [gruplar]);

  const tarihAdi = new Intl.DateTimeFormat(dil === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${veri.tarih}T12:00:00Z`));

  return (
    <main className="gy" lang={dil}>
      <div className="gy-kap">
        <p className="gy-etiket">
          <Link href={dil === "tr" ? "/" : "/en"} className="nav-link">nowby.</Link> · {deneme ? tarihAdi : `${m.ust} · ${yil - 1} → ${yil}`}
        </p>
        <h1 className="gy-baslik">
          {evre === "sonra" && !deneme ? <Vurgu metin={m.arsivBaslik(yil)} yil={yil} /> : m.baslik}
        </h1>
        {deneme && <p className="gy-alt">{m.denemeBaslik(tarihAdi)}</p>}
        <p className="gy-giris">{m.giris(toplam.katalog)}</p>

        {kareler && kareler.length === 12 && yerelGeceYarisi && !karelerKapali && (
          <YilinKareleri kareler={kareler} dil={dil} simdi={simdi} geceYarisi={yerelGeceYarisi} yil={yil} onKapat={() => setKarelerKapali(true)} />
        )}

        <section className="gy-durum" aria-live="polite">
          {evre === "once" && gruplar[0] && (
            <>
              <p className="gy-etiket">{m.ilk} · {ulkeyeGore(gruplar[0].yerler).map((y) => yerAdi(y, dil)).slice(0, 3).join(", ")}</p>
              <p className="gy-sayac">{sure(ilkAn - simdi, dil)}</p>
              <p className="gy-kucuk">{m.istanbul} {istanbulSaati(gruplar[0].an, dil)}</p>
            </>
          )}
          {evre === "sirada" && simdiki && (
            <>
              <p className="gy-etiket"><span className="gy-nokta" aria-hidden="true" />{deneme ? m.simdiGiren : m.simdiGirenYil}</p>
              <p className="gy-yerler-buyuk">
                {ulkeyeGore(simdiki.yerler).slice(0, 6).map((y) => (
                  <span key={`${y.ulke}${y.sehir}`}><span aria-hidden="true">{bayrak(y.ulke)}</span> {yerAdi(y, dil)}</span>
                ))}
              </p>
              {ulkeyeGore(simdiki.yerler).length > 6 && <p className="gy-kucuk">{m.dahasi(ulkeyeGore(simdiki.yerler).length - 6)}</p>}
              {siradaki && (
                <p className="gy-kucuk">
                  {m.sonraki}: <b className="gy-sayac-kucuk">{sure(Date.parse(siradaki.an) - simdi, dil)}</b> · {ulkeyeGore(siradaki.yerler).map((y) => yerAdi(y, dil)).slice(0, 3).join(", ")}
                </p>
              )}
            </>
          )}
          {evre === "sonra" && (
            <p className="gy-ozet">{m.ozet(toplam.radyo, toplam.ulke)}</p>
          )}
        </section>

        <ol className="gy-gruplar">
          {gruplar.map((g) => (
            <Grup key={g.an} g={g} dil={dil} simdi={simdi} simdiki={evre === "sirada" && simdiki?.an === g.an} />
          ))}
        </ol>

        <p className="gy-dipnot">{m.dipnot}</p>
        <p className="gy-etiket gy-son">
          <Link href={m.canliHref} className="nav-link">{m.canli}</Link>
        </p>
      </div>
    </main>
  );
}

function Grup({ g, dil, simdi, simdiki }: { g: GyGrup; dil: Dil; simdi: number; simdiki: boolean }) {
  const m = METIN[dil];
  const an = Date.parse(g.an);
  // Saat geçti ama sunucudan yeni veri henüz gelmedi: "toplanıyor" de, geri sayımı sıfırda bırakma.
  const durum = g.durum === "bekliyor" && an <= simdi ? "hazirlaniyor" : g.durum;
  return (
    <li className={`gy-grup${simdiki ? " simdi" : ""}${durum === "bekliyor" ? " bekliyor" : ""}`} id={`an-${g.an.slice(0, 16).replace(/[^0-9]/g, "")}`}>
      <header className="gy-grup-bas">
        <p className="gy-saat">00:00</p>
        <div className="gy-grup-yer">
          <p className="gy-yerler">
            {ulkeyeGore(g.yerler).map((y, i) => (
              <span key={`${y.ulke}${y.sehir}`}>{i > 0 && ", "}<span aria-hidden="true">{bayrak(y.ulke)}</span> {yerAdi(y, dil)}</span>
            ))}
          </p>
          <p className="gy-kucuk">
            {m.istanbul} {istanbulSaati(g.an, dil)}
            {g.durum === "hazir" && <> · {m.radyo(g.istasyon, g.satirlar.length)}</>}
          </p>
        </div>
      </header>
      {durum === "bekliyor" && <p className="gy-bekle">{m.bekliyor} <span className="gy-sayac-kucuk">{sure(an - simdi, dil)}</span></p>}
      {durum === "hazirlaniyor" && <p className="gy-bekle">{m.hazirlaniyor}</p>}
      {durum === "okunamadi" && <p className="gy-bekle">{m.okunamadi}</p>}
      {g.durum === "hazir" && g.satirlar.length === 0 && <p className="gy-bekle">{m.bos}</p>}
      {g.durum === "hazir" && g.satirlar.length > 0 && (
        <ul className="gy-satirlar">
          {sirala(g.satirlar, dil).map((s) => (
            <li key={s.slug} className="gy-satir">
              <span className="gy-bayrak" aria-hidden="true" title={ulkeAdi(s.ulke, dil)}>{bayrak(s.ulke)}</span>
              <span className="gy-sarki">
                <b>{s.title}</b>
                {s.artist && <span className="gy-sanatci">{s.artist}</span>}
                {s.sonra && <span className="gy-sonra">{m.sonra}</span>}
              </span>
              <Link href={`/radyo/${s.slug}`} className="gy-radyo">{s.ad}</Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Vurgu({ metin, yil }: { metin: string; yil: number }) {
  const i = metin.indexOf(String(yil));
  if (i < 0) return <>{metin}</>;
  const son = metin.slice(i).search(/\s|$/) + i; // yıl ve eki ("2027'ye") birlikte vurgulanır
  return <>{metin.slice(0, i)}<i>{metin.slice(i, son)}</i>{metin.slice(son)}</>;
}

function sirala(s: GySatir[], dil: Dil) {
  const sira = (u: string) => (ULKELER as Record<string, { sira: number }>)[u]?.sira ?? 80;
  return [...s].sort((a, b) => sira(a.ulke) - sira(b.ulke) || a.ad.localeCompare(b.ad, dil));
}
