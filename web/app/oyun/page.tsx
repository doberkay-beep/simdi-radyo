import KorDinleme from "@/components/KorDinleme";

export const metadata = {
  title: "Kör Dinleme — hangi radyo çalıyor? | ŞİMDİ",
  description:
    "İstasyon gizli, sadece ses. Çalan radyoyu tahmin et — kulağın ne kadar keskin? ŞİMDİ'nin kör dinleme oyunu.",
  alternates: { canonical: "/oyun" },
};

export default function Page() {
  return <KorDinleme />;
}
