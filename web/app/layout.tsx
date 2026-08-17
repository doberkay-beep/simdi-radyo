import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "ŞİMDİ — radyoda şu an ne çalıyor",
  description: "Türkiye'deki radyolarda şu an çalan parçalar, canlı.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
