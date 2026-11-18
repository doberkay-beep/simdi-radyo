import type { ReactNode } from "react";
import "./uygulama.css";

// /uygulama — mağaza paketlerinin (Microsoft Store, ileride başka PWA mağazaları) açtığı kabuk.
// Yalnız yazılı izinli radyolar (stations.app_izinli). Kendi manifesti var: kapsamı /uygulama,
// böylece kurulu uygulama sitenin geri kalanına (izinsiz radyoları da gösteren sayfalara) girmez.
export const metadata = {
  title: "nowby.",
  manifest: "/uygulama/manifest.webmanifest",
  robots: { index: false, follow: false },
  alternates: { canonical: "/uygulama" },
};

export default function UygulamaLayout({ children }: { children: ReactNode }) {
  return children;
}
