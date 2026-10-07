import NowList from "@/components/NowList";
import { aktifIstasyonlar } from "@/lib/now";
import { getSupabase } from "@/lib/supabase";
import type { AnaOzet } from "@/components/CanliVitrin";

// Sayfa 30 sn'de bir verisiyle birlikte üretilir: ziyaretçi ilk anda dolu sayfa
// görür (istasyonlar, sayaç, liste); canlı akış istemcide sürer. Veritabanına
// ziyaretçi başına değil 30 sn'de bir sorgu gider.
export const revalidate = 30;

async function anaOzet(): Promise<AnaOzet | null> {
  try {
    const { data } = await getSupabase().from("ana_ozet").select("veri").eq("id", 1).maybeSingle();
    return (data?.veri as AnaOzet) ?? null;
  } catch {
    return null;
  }
}

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

export default async function Home() {
  const [ilkIstasyonlar, ilkOzet] = await Promise.all([aktifIstasyonlar().catch(() => []), anaOzet()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <NowList ilkIstasyonlar={ilkIstasyonlar} ilkOzet={ilkOzet} />
    </>
  );
}
