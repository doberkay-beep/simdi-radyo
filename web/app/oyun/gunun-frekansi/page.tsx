import GununFrekansi from "@/components/GununFrekansi";

export const metadata = {
  title: "Günün Frekansı — herkese aynı gizli radyo | nowby.",
  description:
    "Her gün tek bir gizli radyo, herkese aynısı. 3 hakta ülkesini tahmin et, karneni paylaş. nowby'nin günlük radyo bilmecesi.",
  alternates: { canonical: "/oyun/gunun-frekansi" },
};

export default function Page() {
  return <GununFrekansi />;
}
