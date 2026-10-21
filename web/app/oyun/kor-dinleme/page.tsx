import KorDinleme from "@/components/KorDinleme";

export const metadata = {
  title: "Kör Dinleme — hangi radyo çalıyor? | nowby.",
  description:
    "İstasyon gizli, sadece ses. Çalan radyoyu tahmin et — kulağın ne kadar keskin? nowby'nin kör dinleme oyunu.",
  alternates: { canonical: "/oyun/kor-dinleme" },
};

export default function Page() {
  return <KorDinleme />;
}
