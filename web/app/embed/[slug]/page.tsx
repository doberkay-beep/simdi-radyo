import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import EmbedLive from "@/components/EmbedLive";

// Gömülebilir rozet sayfası — iframe ile başka sitelere konur.
export const revalidate = 300;

const DEFAULT_ACCENT = "#6b7280";

async function getStation(slug: string) {
  try {
    const supa = getSupabase();
    const { data } = await supa
      .from("stations")
      .select("name, accent_color")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return (data as { name: string; accent_color: string | null }) ?? null;
  } catch {
    return null;
  }
}

// Arama motorları gömme sayfasını ayrıca indekslemesin (asıl sayfa /radyo/[slug]).
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getStation(slug);
  const name = s?.name ?? "ŞİMDİ";
  const accent = s?.accent_color || DEFAULT_ACCENT;

  return (
    <div style={{ padding: 8, background: "transparent" }}>
      <EmbedLive slug={slug} name={name} accent={accent} />
    </div>
  );
}
