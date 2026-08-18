import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://berkaydoganco-wnub.vercel.app"),
  title: "ŞİMDİ — radyoda şu an ne çalıyor",
  description: "Türkiye'deki radyolarda şu an çalan parçalar, canlı.",
  openGraph: {
    title: "ŞİMDİ — radyoda şu an ne çalıyor",
    description: "Türkiye'deki radyolarda şu an çalan parçalar, canlı.",
    type: "website",
    locale: "tr_TR",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* Tema seçimini boyamadan önce uygula (flaş olmasın). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('tema')==='light')document.documentElement.dataset.theme='light'}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
