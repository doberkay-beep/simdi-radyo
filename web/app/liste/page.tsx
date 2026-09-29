import Liste from "@/components/Liste";

export const metadata = {
  title: "ŞİMDİ LİSTESİ — Türkiye radyolarının canlı hit listesi",
  description:
    "Türkiye radyolarında şu an gerçekte en çok çalan şarkılar — 355 istasyonun canlı yayın arşivinden saat saat sayım. Sanatçını ara: bu hafta kaç kez çaldı?",
  alternates: { canonical: "/liste" },
};

export default function Page() {
  return <Liste />;
}
