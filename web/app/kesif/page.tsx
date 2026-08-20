import Kesif from "@/components/Kesif";

export const metadata = {
  title: "Keşif — bir frekans seni bulsun | ŞİMDİ",
  description:
    "Ruh haline göre radyo keşfet: sakin, enerjik, hüzünlü, odak. Günün istasyonu, zar at rastgele bir yayına düş, türe göre gez.",
  alternates: { canonical: "/kesif" },
};

export default function Page() {
  return <Kesif />;
}
