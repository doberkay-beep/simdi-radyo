import type { ReactNode } from "react";

export const metadata = {
  title: "ŞİMDİ",
  description: "Türkiye'deki radyolarda şu an ne çalıyor",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
