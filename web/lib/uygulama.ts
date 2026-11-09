import { izinliIstasyonlar } from "./now";

// App Store uygulamaları her isteğe ?uygulama=1 ekler (1.0.2+). Bu isteklerde yalnız yazılı izin
// veren radyoların adı/verisi döner (Apple 5.2.3). Site ve eski uygulama sürümleri etkilenmez.
// CDN önbelleği sorgu dizesine göre ayrıldığı için iki yanıt karışmaz.
export function uygulamaIstegi(req: Request): boolean {
  return new URL(req.url).searchParams.get("uygulama") === "1";
}

export async function izinliKume(): Promise<{ sluglar: Set<string>; idler: number[]; liste: { id: number; slug: string; name: string }[] }> {
  const liste = await izinliIstasyonlar();
  return { sluglar: new Set(liste.map((s) => s.slug)), idler: liste.map((s) => s.id), liste };
}
