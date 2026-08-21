import type { Metadata } from "next";
import Archive from "@/components/Archive";

export const metadata: Metadata = {
  title: "Arşiv — geçmişte radyoda ne çalıyordu | ŞİMDİ",
  description:
    "Belirli bir tarih ve saatte Türkiye'deki radyolarda ne çaldığını gör. ŞİMDİ'nin kalıcı radyo arşivi: geçmişte bugün, parça ve sanatçı araması.",
  alternates: { canonical: "/arsiv" },
  openGraph: {
    title: "ŞİMDİ · Arşiv — geçmişte radyoda ne çalıyordu",
    description: "Kalıcı radyo arşivi: bir tarihe git, o an ne çaldığını gör.",
    type: "website",
  },
};

export default function ArsivPage() {
  return <Archive />;
}
