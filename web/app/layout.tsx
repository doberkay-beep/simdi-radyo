import type { ReactNode } from "react";
import { Instrument_Sans, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

// Marka/UI yazı tipi — berkaydogan.co ailesiyle aynı dil: zarif modern sans.
const brand = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-brand",
  display: "swap",
});

// Edebi "okuma" fontu — mısralar, epigraflar, düzyazı (kitap hissi).
const read = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-read",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://necaliyor.co"),
  title: "ŞİMDİ — radyoda şu an ne çalıyor",
  description:
    "Türkiye'deki (ve seçili yabancı) radyolarda şu an çalan parçalar, canlı. What's playing right now on Turkish radio.",
  keywords: ["radyo", "canlı radyo", "şu an çalan", "Turkish radio", "now playing", "live radio"],
  alternates: {
    canonical: "/",
    languages: { "tr-TR": "/", "en": "/", "x-default": "/" },
  },
  openGraph: {
    title: "ŞİMDİ — radyoda şu an ne çalıyor",
    description:
      "Türkiye'deki radyolarda şu an çalan parçalar, canlı. Now playing on Turkish & world radio.",
    type: "website",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
  },
};

export const viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={`${brand.variable} ${read.variable}`} suppressHydrationWarning>
      <head>
        {/* Tema seçimini boyamadan önce uygula (flaş olmasın). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('tema');var l=t==='light'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: light)').matches);if(l)document.documentElement.dataset.theme='light'}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        {/* Zemine neredeyse görünmez doku — derinlik hissi. */}
        <div className="grain" aria-hidden />
        <RegisterSW />
        <Analytics />
      </body>
    </html>
  );
}
