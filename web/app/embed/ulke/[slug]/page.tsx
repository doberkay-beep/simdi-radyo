import type { Metadata } from "next";
import { ULKELER, ULKE_SLUG, ulkeIstasyonSluglari, bayrakEmoji } from "@/lib/ulkeler";
import UlkeRozet from "@/components/UlkeRozet";

// Gömülebilir ülke rozeti — iframe ile başka sitelere konur (backlink motoru).
export const revalidate = 600;

export function generateStaticParams() {
  return Object.keys(ULKE_SLUG).map((slug) => ({ slug }));
}

// Asıl sayfa /ulke/[slug]; gömme sayfası indekslenmesin.
export const metadata: Metadata = { robots: { index: false, follow: true } };

/* Lokatif eki — ünlü uyumu + ünsüz sertleşmesi: Japonya'da, İsveç'te, ABD'de. */
function da(ad: string): string {
  if (ad === "ABD") return "ABD'de";
  const kucuk = ad.toLowerCase();
  const sert = "fstkçşhp".includes(kucuk[kucuk.length - 1]);
  const unluler = [...kucuk].filter((c) => "aeıioöuü".includes(c));
  const son = unluler[unluler.length - 1] ?? "e";
  return `${ad}'${sert ? "t" : "d"}${"aıou".includes(son) ? "a" : "e"}`;
}

export default async function UlkeEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kod = ULKE_SLUG[slug];
  const ad = kod ? (kod === "www" ? "İnternet" : ULKELER[kod].tr) : "Dünya";
  const sluglar = kod ? ulkeIstasyonSluglari(kod) : [];

  return (
    <div style={{ padding: 6, background: "transparent" }}>
      <UlkeRozet sluglar={sluglar} baslikDa={da(ad)} bayrak={kod ? bayrakEmoji(kod) : "🌍"} ulkeSlugu={slug} />
    </div>
  );
}
