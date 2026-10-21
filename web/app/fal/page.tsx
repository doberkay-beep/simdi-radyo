import FrekansFali from "@/components/FrekansFali";

export const metadata = {
  title: "Frekans Falı — ruh hâline göre radyo | nowby.",
  description:
    "Bu gece nasılsın? Söyle; sana yayımlanmış bir dize ve bir radyo frekansı düşsün. Kartını al, falını paylaş — nowby'nin frekans falı.",
  alternates: { canonical: "/fal" },
};

export default function Page() {
  return <FrekansFali />;
}
