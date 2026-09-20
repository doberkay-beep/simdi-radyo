import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import DilToggle from "@/components/DilToggle";
import RozetSecici from "@/components/RozetSecici";
import { getSupabase } from "@/lib/supabase";

// Self-servis rozet sayfası — herkes kendi/ favori istasyonunun canlı "şu an
// çalıyor" rozetini seçip kodunu alsın. Gömme = necaliyor.co'ya gerçek backlink.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Radyo Rozeti — Siteye Canlı 'Şu An Çalıyor' Ekle | ŞİMDİ",
  description:
    "Favori radyonun şu an ne çaldığını gösteren canlı rozeti tek satır kodla sitene, blog'una ekle. Ücretsiz, otomatik güncellenir.",
  alternates: { canonical: "/rozet" },
};

type Ist = { slug: string; name: string; accent: string };

async function getList(): Promise<Ist[]> {
  try {
    const supa = getSupabase();
    const { data } = await supa
      .from("stations")
      .select("slug, name, accent_color")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return ((data ?? []) as { slug: string; name: string; accent_color: string | null }[]).map((s) => ({
      slug: s.slug,
      name: s.name,
      accent: s.accent_color || "#6b7280",
    }));
  } catch {
    return [];
  }
}

export default async function RozetPage() {
  const list = await getList();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Radyo Rozeti — Siteye Canlı 'Şu An Çalıyor' Ekle",
    url: "https://necaliyor.co/rozet",
    description:
      "Favori radyonun şu an ne çaldığını gösteren canlı rozeti tek satır kodla sitene ekle.",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-10 flex items-end justify-between">
          <h1 className="brand text-4xl font-bold tracking-tight">
            ŞİMDİ <span style={{ color: "var(--muted)" }}>· rozet</span>
          </h1>
          <span className="flex items-center gap-3">
            <DilToggle />
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        <p className="dize mb-3 text-lg">radyon nerede çalıyorsa, orada görünsün.</p>
        <div className="read text-[17px] leading-relaxed" style={{ color: "var(--fg)" }}>
          <p>
            Favori radyonun <strong>şu an ne çaldığını</strong> gösteren canlı bir rozet. Tek satır kodla
            sitene, blog&apos;una ya da kişisel sayfana koyarsın; kendi kendine güncellenir. Ücretsiz.
            İstasyonunu seç, önizle, kodu kopyala.
          </p>
        </div>

        {list.length > 0 ? (
          <RozetSecici list={list} />
        ) : (
          <p className="mt-8 text-sm" style={{ color: "var(--muted)" }}>
            İstasyon listesi şu an yüklenemedi. Birazdan tekrar dene.
          </p>
        )}

        <div className="read mt-12 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
          <p>
            Rozet, istasyonun canlı yayınına ve{" "}
            <Link href="/" className="underline" style={{ color: "var(--fg)" }}>
              necaliyor.co
            </Link>
            &apos;ya bağlanır — dinleyicilerini asıl sayfaya taşır, şu an çalanı herkese gösterir.
          </p>
        </div>
      </div>
    </div>
  );
}
