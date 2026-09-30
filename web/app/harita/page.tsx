import CanliHarita from "@/components/CanliHarita";

export const metadata = {
  title: "Canlı Harita — dünyada şu an çalan radyolar | ŞİMDİ",
  description:
    "Dünya bir gece göğü, her istasyon bir ışık: 50+ ülkede radyolarda şu an ne çalıyor, şarkı değiştiği an haritada parlıyor. Tam ekran yap, arkaya bırak.",
  alternates: { canonical: "/harita" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ embed?: string }> }) {
  const p = await searchParams;
  return <CanliHarita embed={p.embed === "1"} />;
}
