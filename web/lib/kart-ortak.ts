import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Paylaşım kartlarının (sanatçı rozeti, istasyon rozeti, senkron kartı)
// ortak dili: boyutlar, kor paleti, fontlar.

export const BOYUT = {
  post: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
  og: { w: 1200, h: 630 },
} as const;
export type Boyut = keyof typeof BOYUT;

export function boyutAl(req: Request): Boyut {
  const b = new URL(req.url).searchParams.get("boyut");
  return b === "story" || b === "og" ? b : "post";
}

export const RENK = {
  zemin1: "#16090f", zemin2: "#070405", kor: "#e5382c", sicak: "#ff9b76",
  metin: "#f2e6da", soluk: "#a08574", cizgi: "#3a1d19",
};

export const kes = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

export async function fontlar() {
  const [baslik, govde, siir] = await Promise.all([
    readFile(join(process.cwd(), "assets/BricolageGrotesque-Bold.ttf")),
    readFile(join(process.cwd(), "assets/LiberationSans-Bold.ttf")),
    readFile(join(process.cwd(), "assets/Lora-Italic.ttf")),
  ]);
  return [
    { name: "Baslik", data: baslik, weight: 700 as const, style: "normal" as const },
    { name: "Govde", data: govde, weight: 700 as const, style: "normal" as const },
    { name: "Siir", data: siir, weight: 400 as const, style: "italic" as const },
  ];
}

// Story güvenli alanı: Instagram üstte ~250 px (ad, ilerleme çubuğu), altta ~420 px
// (yanıt kutusu, bağlantı etiketi) kendi arayüzünü çizer — içerik bunların dışında kalır.
export const STORY_DOLGU = "250px 90px 420px";

export const KART_ONBELLEK = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

export function zemin(og: boolean) {
  return {
    backgroundColor: RENK.zemin2,
    backgroundImage: `radial-gradient(circle at 50% ${og ? "0%" : "8%"}, #3a120f 0%, ${RENK.zemin1} 45%, ${RENK.zemin2} 100%)`,
  };
}
