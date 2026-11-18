import Vitrin from "@/components/Vitrin";
import { aktifIstasyonlar } from "@/lib/now";
import "./vitrin.css";

// 19 Kas 2026 (Berkay): ana sayfa uygulamaların vitrini oldu. Bütün radyoların canlı listesi
// gizli /canli adresine taşındı (bağlantı yok, arama motorlarına kapalı).
// İzinli radyo sayısı elle yazılmaz: uygulamaların gösterdiği listeden (app_izinli) okunur.
export const revalidate = 300;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "nowby.",
  alternateName: "nowby.co",
  url: "https://nowby.co",
  inLanguage: "tr-TR",
  description: "Radyolarda şu an çalan parçalar, canlı. iPhone, iPad, Mac, Apple TV ve Apple Watch için nowby. uygulaması.",
  creator: { "@type": "Person", name: "Berkay Doğan", url: "https://berkaydogan.co" },
};

export default async function Home() {
  const izinli = await aktifIstasyonlar({ uygulama: true, onbellekli: true }).catch(() => []);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Vitrin izinliSayi={izinli.length} />
    </>
  );
}
