import type { ReactNode } from "react";
import { Newsreader, Bodoni_Moda } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import RegisterSW from "@/components/RegisterSW";
import AltBilgi from "@/components/AltBilgi";
import KasaBekcisi from "@/components/KasaBekcisi";
import "./globals.css";
import "./yeni-dil.css";

// Tek yazı ailesi: berkaydogan.co ile aynı.
const yazi = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-yazi",
  display: "swap",
});

// Başlık yazısı: büyük ve az kullanılır; küçük metinler Newsreader.
const baslik = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-baslik",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://nowby.co"),
  title: "nowby. — radyoda şu an ne çalıyor",
  description:
    "Türkiye'deki (ve seçili yabancı) radyolarda şu an çalan parçalar, canlı. What's playing right now on Turkish radio.",
  keywords: ["radyo", "canlı radyo", "şu an çalan", "Turkish radio", "now playing", "live radio"],
  alternates: {
    canonical: "/",
    languages: { "tr-TR": "/", "en": "/", "x-default": "/" },
  },
  appleWebApp: {
    capable: true,
    title: "nowby.",
    statusBarStyle: "black-translucent" as const,
  },
  openGraph: {
    title: "nowby. — radyoda şu an ne çalıyor",
    description:
      "Türkiye'deki radyolarda şu an çalan parçalar, canlı. Now playing on Turkish & world radio.",
    type: "website",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={`${yazi.variable} ${baslik.variable}`} suppressHydrationWarning>
      <head>
        {/* Tema seçimini boyamadan önce uygula (flaş olmasın). Dil de: html lang hep "tr"
            kalınca İngilizce metinde CSS uppercase "i"yi "İ" yapıyordu (PLAYİNG). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('tema');if(t==='light')document.documentElement.dataset.theme='light'}catch(e){}try{var d=localStorage.getItem('dil');if(d!=='en'&&d!=='tr')d=(navigator.language||'tr').toLowerCase().indexOf('tr')===0?'tr':'en';document.documentElement.lang=d}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <AltBilgi />
        {/* Zemine neredeyse görünmez doku — derinlik hissi. */}
        <div className="grain" aria-hidden />
        <RegisterSW />
        <KasaBekcisi />
        <Analytics />
      </body>
    </html>
  );
}
