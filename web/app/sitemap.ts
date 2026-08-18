import type { MetadataRoute } from "next";
import { getSupabase } from "@/lib/supabase";

// Aktif istasyonları da haritaya koy → Google her radyonun sayfasını indeksler.
export const revalidate = 3600;

const BASE = "https://necaliyor.co";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = [];
  try {
    const supa = getSupabase();
    const { data } = await supa.from("stations").select("slug").eq("is_active", true);
    slugs = (data ?? []).map((r: { slug: string }) => r.slug);
  } catch {
    // veritabanı okunamazsa sadece sabit sayfalar
  }

  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/arsiv`, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE}/hakkinda`, changeFrequency: "monthly", priority: 0.4 },
    ...slugs.map((slug) => ({
      url: `${BASE}/radyo/${slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
  ];
}
