import NeredenCaliyor from "@/components/NeredenCaliyor";

export const metadata = {
  title: "Nereden Çalıyor? — ülkeyi tahmin et | ŞİMDİ",
  description:
    "Dünyadan bir radyo kör çalar; dilinden, türünden, havasından hangi ülkeden yayın yaptığını tahmin et. ŞİMDİ'nin dünya oyunu.",
  alternates: { canonical: "/oyun/nereden" },
};

export default function Page() {
  return <NeredenCaliyor />;
}
