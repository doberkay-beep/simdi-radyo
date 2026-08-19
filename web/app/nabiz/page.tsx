import Nabiz from "@/components/Nabiz";

export const metadata = {
  title: "Radyo Nabzı — Türk radyosunun kalp atışı | ŞİMDİ",
  description:
    "Şu an Türkiye'deki radyolarda en çok ne çalıyor? Aynı anda birden fazla istasyonda çalan parçalar ve son 24 saatin en çok çalanları — canlı.",
  alternates: { canonical: "/nabiz" },
};

export default function Page() {
  return <Nabiz />;
}
