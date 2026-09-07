import type { Metadata } from "next";
import Kesif from "@/components/Kesif";
import { dilSunucu } from "@/lib/dil-sunucu";

export async function generateMetadata(): Promise<Metadata> {
  const dil = await dilSunucu();
  const en = dil === "en";
  return {
    title: en ? "Discover — let a frequency find you | ŞİMDİ" : "Keşif — bir frekans seni bulsun | ŞİMDİ",
    description: en
      ? "Discover radio by mood: calm, energetic, melancholic, focus. Station of the day, roll the dice onto a random stream, browse by genre."
      : "Ruh haline göre radyo keşfet: sakin, enerjik, hüzünlü, odak. Günün istasyonu, zar at rastgele bir yayına düş, türe göre gez.",
    alternates: { canonical: "/kesif" },
  };
}

export default function Page() {
  return <Kesif />;
}
