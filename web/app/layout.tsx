import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Marka yazı tipi — "ŞİMDİ" kelime işareti için (duyuru görselleriyle aynı dil).
// Yerelden yükleniyor (ağ bağımlılığı yok, Türkçe harfleri destekler).
const brand = localFont({
  src: "../assets/BricolageGrotesque-Bold.ttf",
  weight: "700",
  variable: "--font-brand",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://necaliyor.co"),
  title: "ŞİMDİ — radyoda şu an ne çalıyor",
  description: "Türkiye'deki radyolarda şu an çalan parçalar, canlı.",
  openGraph: {
    title: "ŞİMDİ — radyoda şu an ne çalıyor",
    description: "Türkiye'deki radyolarda şu an çalan parçalar, canlı.",
    type: "website",
    locale: "tr_TR",
  },
};

export const viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={brand.variable} suppressHydrationWarning>
      <head>
        {/* Tema seçimini boyamadan önce uygula (flaş olmasın). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('tema')==='light')document.documentElement.dataset.theme='light'}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        {/* Zemine neredeyse görünmez doku — derinlik hissi. */}
        <div className="grain" aria-hidden />
        <Analytics />
      </body>
    </html>
  );
}
