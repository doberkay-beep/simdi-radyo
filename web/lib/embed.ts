// Gömme kodu üreticisi — hem istasyon sayfasındaki "siteme ekle" hem de
// /rozet self-servis sayfası aynı kodu kullansın. iframe + DIŞINDA gerçek,
// crawlanabilir künye linki (backlink değeri buradan gelir).

export type EmbedBoy = "kart" | "ince" | "genis";

export const EMBED_BOYLAR: Record<EmbedBoy, { w: number; h: number; ad: string }> = {
  kart: { w: 360, h: 92, ad: "kart · 360×92" },
  ince: { w: 468, h: 60, ad: "ince şerit · 468×60" },
  genis: { w: 728, h: 90, ad: "geniş · 728×90" },
};

export function embedKodu(slug: string, name: string, boy: EmbedBoy = "kart"): string {
  const ad = name.replace(/"/g, "'");
  const { w, h } = EMBED_BOYLAR[boy];
  const q = boy === "kart" ? "" : `?boy=${boy}`;
  return `<div style="max-width:${w}px">
  <iframe src="https://necaliyor.co/embed/${slug}${q}" width="${w}" height="${h}" style="border:0;border-radius:${boy === "ince" ? 12 : 16}px;max-width:100%" title="${ad} — şu an ne çalıyor" loading="lazy"></iframe>
  <p style="font:12px/1.4 system-ui,sans-serif;margin:6px 2px 0;color:#888">
    <a href="https://necaliyor.co/radyo/${slug}" style="color:inherit">${ad} şu an ne çalıyor</a> · <a href="https://necaliyor.co" style="color:inherit">necaliyor.co</a>
  </p>
</div>`;
}
