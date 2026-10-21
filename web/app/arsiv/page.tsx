import type { Metadata } from "next";
import Archive from "@/components/Archive";

export const metadata: Metadata = {
  title: "Arşiv — geçmişte radyoda ne çalıyordu | nowby.",
  description:
    "Belirli bir tarih ve saatte Türkiye'deki radyolarda ne çaldığını gör. nowby'nin kalıcı radyo arşivi: geçmişte bugün, parça ve sanatçı araması.",
  alternates: { canonical: "/arsiv" },
  openGraph: {
    title: "nowby. · Arşiv — geçmişte radyoda ne çalıyordu",
    description: "Kalıcı radyo arşivi: bir tarihe git, o an ne çaldığını gör.",
    type: "website",
  },
};

export default function ArsivPage() {
  return <Archive />;
}
