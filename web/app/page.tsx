import NowList from "@/components/NowList";

// Ana sayfa yapılandırılmış verisi — arama motorlarına site kimliği.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ŞİMDİ",
  alternateName: "necaliyor.co",
  url: "https://necaliyor.co",
  inLanguage: "tr-TR",
  description: "Türkiye'deki ve dünyadan seçili radyolarda şu an çalan parçalar, canlı.",
  creator: { "@type": "Person", name: "Berkay Doğan", url: "https://berkaydogan.co" },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <NowList />
    </>
  );
}
