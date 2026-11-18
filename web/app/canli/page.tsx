import NowList from "@/components/NowList";
import { aktifIstasyonlar } from "@/lib/now";
import { getSupabase } from "@/lib/supabase";
import type { AnaOzet } from "@/components/CanliVitrin";

// Sayfa 30 sn'de bir verisiyle birlikte üretilir: ziyaretçi ilk anda dolu sayfa
// görür (istasyonlar, sayaç, liste); canlı akış istemcide sürer. Veritabanına
// ziyaretçi başına değil 30 sn'de bir sorgu gider.
export const revalidate = 30;

// 19 Kas 2026 (Berkay): bütün radyoların canlı listesi ana sayfadan buraya taşındı.
// Çalışır ama gizli: sitede bağlantı verilmez, arama motorlarına kapalı. Ana sayfa artık
// uygulamaların vitrini; uygulamalar ve web çalar (/uygulama) yalnız izinli radyoları gösterir.
export const metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/canli" },
};

async function anaOzet(): Promise<AnaOzet | null> {
  try {
    const { data } = await getSupabase().from("ana_ozet").select("veri").eq("id", 1).maybeSingle();
    return (data?.veri as AnaOzet) ?? null;
  } catch {
    return null;
  }
}

export default async function Canli() {
  const [ilkIstasyonlar, ilkOzet] = await Promise.all([aktifIstasyonlar({ onbellekli: true }).catch(() => []), anaOzet()]);
  return (
    <>
      <NowList ilkIstasyonlar={ilkIstasyonlar} ilkOzet={ilkOzet} />
    </>
  );
}
