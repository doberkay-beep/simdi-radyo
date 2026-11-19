"use client";

// Ana sayfa vitrini — 19 Kas 2026 (Berkay onayı). nowby. artık beş Apple platformunda;
// Windows ve Android yolda. Bütün radyoların canlı listesi gizli /canli adresinde çalışır.
// Web çalar (/uygulama) ve uygulamalar yalnız yazılı izinli radyoları gösterir.
// Ünlem yok; Android kapalı testte olduğu için bağlantı verilmez.

import Link from "next/link";
import { useDil } from "@/lib/i18n";
import DilToggle from "@/components/DilToggle";
import ThemeToggle from "@/components/ThemeToggle";

const APP_STORE = "https://apps.apple.com/app/id6825787056";
const IZIN_MAIL = "mailto:hello@berkaydogan.co?subject=nowby.%20izin";
const KALDIR_MAIL = "mailto:hello@berkaydogan.co?subject=nowby.%20kald%C4%B1rma%20iste%C4%9Fi";

type Durum = "var" | "yakin";
type Cihaz = { ad: string; tr: string; en: string; durum: Durum; trD: string; enD: string; href?: string; ikon: React.ReactNode; burada?: boolean };

const ikon = (d: React.ReactNode) => (
  <svg viewBox="0 0 32 32" aria-hidden>
    {d}
  </svg>
);

const CIHAZLAR: Cihaz[] = [
  { ad: "iPhone", tr: "Canlı liste, widget, Sürüş modu, alarm.", en: "Live list, widget, driving mode, alarm.", durum: "var", trD: "App Store'da", enD: "On the App Store", href: APP_STORE,
    ikon: ikon(<><rect x="9" y="3" width="14" height="26" rx="3" /><line x1="14" y1="25.5" x2="18" y2="25.5" /></>) },
  { ad: "iPad", tr: "Kenar çubuğu ve şarkı kartlarıyla geniş düzen.", en: "A wide layout with a sidebar and song cards.", durum: "var", trD: "App Store'da", enD: "On the App Store", href: APP_STORE,
    ikon: ikon(<><rect x="5" y="3" width="22" height="26" rx="2.5" /><circle cx="16" cy="26" r=".8" /></>) },
  { ad: "Mac", tr: "Çalışırken yanında; altta boydan boya çalar.", en: "Beside your work, with a full-width player.", durum: "var", trD: "App Store'da", enD: "On the App Store", href: APP_STORE,
    ikon: ikon(<><rect x="5" y="6" width="22" height="15" rx="1.5" /><path d="M2 24h28l-2 2.5H4z" /></>) },
  { ad: "Apple TV", tr: "Salonun radyosu; şarkı kartları büyük ekranda.", en: "The living-room radio, song cards on the big screen.", durum: "var", trD: "App Store'da", enD: "On the App Store", href: APP_STORE,
    ikon: ikon(<><rect x="3" y="6" width="26" height="16" rx="1.5" /><line x1="11" y1="26" x2="21" y2="26" /></>) },
  { ad: "Apple Watch", tr: "Bileğinde radyo; kadranda günün 1 numarası.", en: "Radio on your wrist; today's number one on the face.", durum: "var", trD: "iPhone ile gelir", enD: "Comes with iPhone", href: APP_STORE,
    ikon: ikon(<><rect x="9" y="8" width="14" height="16" rx="4" /><path d="M12 8l1-5h6l1 5M12 24l1 5h6l1-5" /></>) },
  { ad: "Windows", tr: "Microsoft Store'dan, bilgisayarına kurulan nowby.", en: "nowby. for your PC, from the Microsoft Store.", durum: "yakin", trD: "Yakında", enD: "Coming soon",
    ikon: ikon(<path d="M4 7l10-1.5v10H4zM16 5.2L28 3.5v12H16zM4 17.5h10v9.8L4 26zM16 17.5h12v11L16 26.8z" />) },
  { ad: "Android", tr: "Google Play'de testte; yakında herkese açık.", en: "In testing on Google Play; open to everyone soon.", durum: "yakin", trD: "Testte", enD: "In testing",
    ikon: ikon(<><rect x="8" y="9" width="16" height="17" rx="2" /><path d="M11 9a5 5 0 0 1 10 0M12 4l2 3M20 4l-2 3" /></>) },
  { ad: "CarPlay", tr: "Arabada: şimdi çalanlar ve favorilerin; dokun, dinle.", en: "In the car: what's playing now and your favorites; tap and listen.", durum: "yakin", trD: "Yakında", enD: "Coming soon",
    ikon: ikon(<><path d="M5 20l2.5-7.5A3 3 0 0 1 10.3 10.5h11.4a3 3 0 0 1 2.8 2l2.5 7.5" /><rect x="3" y="20" width="26" height="6" rx="2" /><circle cx="9" cy="23" r="1.2" /><circle cx="23" cy="23" r="1.2" /></>) },
  { ad: "Web", tr: "Şu an buradasın. Hiçbir şey kurmadan dinle.", en: "You are here. Listen without installing anything.", durum: "var", trD: "Aşağıda, açık", enD: "Below, open", href: "#dinle", burada: true,
    ikon: ikon(<><circle cx="16" cy="16" r="12" /><path d="M4 16h24M16 4c4 4 4 20 0 24M16 4c-4 4-4 20 0 24" /></>) },
];

const OZELLIKLER = [
  { tr: ["Sürüş modu", "Arabada dev düğmeler; ekran kapanmaz, tek dokunuşla radyo değişir."], en: ["Driving mode", "Big buttons in the car; the screen stays on, one tap changes the station."], yer: "iPhone" },
  { tr: ["Radyo alarmı", "Sabah sevdiğin radyoyla uyan; ses yavaş yavaş açılır."], en: ["Radio alarm", "Wake up to your station; the volume rises slowly."], yer: "iPhone · iPad" },
  { tr: ["Av Defteri", "Radyoda yakaladığın şarkıları topla, sanatçıları izle."], en: ["Catch log", "Collect the songs you catch on the radio and follow artists."], yer: "iPhone · iPad · Mac" },
  { tr: ["Frekansım", "Bu ay ne dinledin? Ay sonunda sana özel bir karne."], en: ["My frequency", "What did you listen to this month? A report card just for you."], yer: "iPhone · iPad · Mac" },
  { tr: ["Birlikte dinle", "Bir oda aç, arkadaşına gönder; aynı radyoyu aynı anda dinleyin."], en: ["Listen together", "Open a room, send it to a friend, hear the same station at the same moment."], yer: "iPhone · iPad · Mac" },
  { tr: ["Bileğinde, kadranında", "Apple Watch'ta radyo, kadranda günün 1 numarası; ana ekranda widget."], en: ["On your wrist", "Radio on Apple Watch, today's number one on the face, a widget on the home screen."], yer: "Apple Watch · widget" },
];

// "Gece yarısı ne çalıyordu?" (yılbaşı) bağlantısı yalnız mevsiminde: 15 Kasım – 31 Ocak.
function yilbasiMevsimi(t = new Date()) {
  const ay = t.getMonth(), gun = t.getDate();
  return ay === 11 || ay === 0 || (ay === 10 && gun >= 15);
}

export default function Vitrin({ izinliSayi }: { izinliSayi: number }) {
  const { dil } = useDil();
  const en = dil === "en";

  return (
    <main className="vt">
      <div className="vt-kap">
        <header className="vt-ust">
          <Link href="/" className="vt-logo" aria-label="nowby.">
            nowby<b>.</b>
          </Link>
          <nav className="vt-nav" aria-label={en ? "sections" : "bölümler"}>
            <Link href="/liste">{en ? "Chart" : "Liste"}</Link>
            <Link href="/nabiz">{en ? "Pulse" : "Nabız"}</Link>
            <Link href="/kesif">{en ? "Discover" : "Keşif"}</Link>
            <Link href="/ulke">{en ? "World" : "Dünya"}</Link>
            <Link href="/kose">{en ? "Essays" : "Köşe"}</Link>
            <span className="vt-ayar">
              <DilToggle />
              <ThemeToggle />
            </span>
          </nav>
        </header>

        {/* AÇILIŞ */}
        <section className="vt-acilis">
          <h1>{en ? "What is playing on the radio right now?" : "Radyoda şu an ne çalıyor?"}</h1>
          <p className="vt-giris">
            {en
              ? "nowby. shows what stations are playing this very minute and lets you listen with one tap. On iPhone, iPad, Mac, Apple TV and Apple Watch; free, no ads, no account."
              : "nowby. radyolarda tam bu dakika ne çaldığını gösterir, tek dokunuşla dinletir. iPhone, iPad, Mac, Apple TV ve Apple Watch'ta; ücretsiz, reklamsız, hesapsız."}
          </p>
          <p className="vt-yakinda">{en ? "Coming soon to Windows and Android." : "Yakında Windows ve Android'de de."}</p>
          <div className="vt-dugmeler">
            <a className="vt-dugme dolu" href={APP_STORE}>
              {en ? "Download on the App Store" : "App Store'dan indir"}
            </a>
            <a className="vt-dugme bos" href="#dinle">
              {en ? "Listen on the web" : "Web'de dinle"}
            </a>
          </div>
          {yilbasiMevsimi() && (
            <Link className="vt-duyuru" href={en ? "/en/midnight" : "/gece-yarisi"}>
              <span className="nokta" aria-hidden="true" />
              {en ? "New Year's Eve: " : "Yılbaşı gecesi: "}
              <i>{en ? "What was playing at midnight?" : "Gece yarısı ne çalıyordu?"}</i> →
            </Link>
          )}
        </section>

        {/* WEB ÇALAR — /uygulama kabuğu, yalnız izinli radyolar */}
        <section className="vt-bolum vt-calar" id="dinle">
          <div className="vt-etiket">{en ? "Live · on the web" : "Canlı · web'de"}</div>
          <iframe src="/uygulama" title={en ? "nowby. web player" : "nowby. web çalar"} loading="lazy" allow="autoplay" />
          <p className="vt-not">
            <a href="/uygulama">{en ? "Open full screen →" : "Tam ekran aç →"}</a>
          </p>
        </section>

        {/* 01 · HER EKRANDA */}
        <section className="vt-bolum" id="uygulamalar">
          <div className="vt-etiket">01 · {en ? "Apps" : "Uygulamalar"}</div>
          <h2>
            {en ? "The same frequency, " : "Her ekranda "}
            <i>{en ? "on every screen." : "aynı frekans."}</i>
          </h2>
          <p className="vt-giris">
            {en
              ? "nowby. is in your pocket, on your desk, on your wrist and in your living room. The apps are free, have no ads and need no account; your favorites follow you across Apple devices through iCloud."
              : "nowby. artık cebinde, masanda, bileğinde ve salonunda. Uygulamalar ücretsiz, reklamsız ve hesap istemez; favorilerin iCloud ile bütün Apple cihazlarında seninle gelir."}
          </p>
          <div className="vt-cihazlar">
            {CIHAZLAR.map((c) => {
              const ic = (
                <>
                  {c.ikon}
                  <span className="ad">{c.ad}</span>
                  <span className="ne">{en ? c.en : c.tr}</span>
                  <span className={`durum ${c.durum}`}>{en ? c.enD : c.trD}</span>
                </>
              );
              const sinif = `vt-cihaz${c.burada ? " burada" : ""}${c.href ? "" : " pasif"}`;
              return c.href ? (
                <a key={c.ad} className={sinif} href={c.href}>
                  {ic}
                </a>
              ) : (
                <div key={c.ad} className={sinif}>
                  {ic}
                </div>
              );
            })}
          </div>
        </section>

        {/* ARABADA — CarPlay (19 Kas 2026: Apple izni geldi, iOS 1.0.3 incelemede) */}
        <section className="vt-bolum vt-araba">
          <div className="vt-etiket">{en ? "In the car" : "Arabada"}</div>
          <h2>
            {en ? "The same frequency, " : "Yol boyunca "}
            <i>{en ? "all the way." : "aynı frekans."}</i>
          </h2>
          <p className="vt-giris">
            {en
              ? "nowby. is coming to CarPlay: what stations are playing right now and your favorites, on the car screen. Tap a station and it plays. No typing, eyes stay on the road."
              : "nowby. CarPlay'e geliyor: radyolarda şu an çalanlar ve favorilerin, araba ekranında. Bir radyoya dokun, çalsın. Yazı yok, göz yolda kalır."}
          </p>
          <div className="vt-araba-gorseller">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/carplay/carplay-simdi.jpg" alt={en ? "nowby. on CarPlay: playing now" : "nowby. CarPlay'de: şimdi çalanlar"} width={1400} height={845} loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/carplay/carplay-favoriler.jpg" alt={en ? "nowby. on CarPlay: favorites" : "nowby. CarPlay'de: favoriler"} width={1400} height={845} loading="lazy" />
          </div>
          <p className="vt-not" style={{ textAlign: "left" }}>
            {en ? "In Apple review; it arrives with the iPhone update once approved." : "Apple incelemesinde; onaylanınca iPhone güncellemesiyle gelir."}
          </p>
        </section>

        {/* 02 · YALNIZ UYGULAMADA */}
        <section className="vt-bolum">
          <div className="vt-etiket">02 · {en ? "More in the app" : "Uygulamada fazlası var"}</div>
          <h2>
            {en ? "Six things " : "Sitede olmayan "}
            <i>{en ? "the website does not have." : "altı şey."}</i>
          </h2>
          <p className="vt-giris">
            {en
              ? "These live only in the apps, because they need a phone, a watch or a car."
              : "Bunlar yalnız uygulamada, çünkü bir telefona, bir saate ya da bir arabaya ihtiyaç duyuyorlar."}
          </p>
          <div className="vt-ozellikler">
            {OZELLIKLER.map((o, i) => (
              <div className="vt-oz" key={o.yer + i}>
                <span className="no">{String(i + 1).padStart(2, "0")}</span>
                <h3>{(en ? o.en : o.tr)[0]}</h3>
                <p>{(en ? o.en : o.tr)[1]}</p>
                <div className="yer">{o.yer}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 03 · RADYOLAR İÇİN */}
        <section className="vt-bolum vt-radyolar">
          <div>
            <div className="vt-etiket">03 · {en ? "For stations" : "Radyolar için"}</div>
            <h2>{en ? "Are you a station?" : "Bir radyo musunuz?"}</h2>
            <p className="vt-giris">
              {en
                ? "nowby. does not record or relay broadcasts; it sends listeners to the station's own official stream. Only stations that have given written permission appear in the apps."
                : "nowby. yayınları kaydetmez ve aktarmaz; dinleyiciyi radyonun kendi resmî yayınına götürür. Uygulamalarda yalnız yazılı izin veren radyolar yer alır."}
            </p>
            {izinliSayi > 0 && (
              <div className="vt-sayi">
                {izinliSayi}
                <small>{en ? "stations have given written permission and appear in the apps" : "radyo yazılı izin verdi, uygulamalarda yer alıyor"}</small>
              </div>
            )}
          </div>
          <div className="vt-liste3">
            <a href={IZIN_MAIL}>
              <div>
                <b>{en ? "Be in the apps" : "Uygulamada yer alın"}</b>
                <span>{en ? "Give permission in a one-line email; you are added the same day." : "Tek satırlık bir e-postayla izin verin; aynı gün eklenir."}</span>
              </div>
              <em>→</em>
            </a>
            <Link href="/rozet">
              <div>
                <b>{en ? "Badge and now-playing box" : "Rozet ve şu an çalan kutusu"}</b>
                <span>{en ? "Put them on your own website." : "Kendi sitenize koyun: rozet ve radyonuzda o an çalan şarkı."}</span>
              </div>
              <em>→</em>
            </Link>
            <a href={KALDIR_MAIL}>
              <div>
                <b>{en ? "Removal request" : "Kaldırılma isteği"}</b>
                <span>{en ? "If you would rather not be listed, write to us; we remove it the same day." : "Listede olmak istemiyorsanız yazın; aynı gün kaldırırız."}</span>
              </div>
              <em>→</em>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
