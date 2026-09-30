import type { Metadata } from "next";
import EmbedListe from "@/components/EmbedListe";

// Gömülebilir ŞİMDİ LİSTESİ — iframe ile başka sitelere konur.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function Page({ searchParams }: { searchParams: Promise<{ boy?: string }> }) {
  const p = await searchParams;
  return <EmbedListe boy={p.boy === "genis" ? "genis" : "kart"} />;
}
