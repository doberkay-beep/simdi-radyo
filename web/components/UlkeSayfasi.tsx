import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import {
  ULKELER, ulkeSlug, ulkeSlugEn, bayrakUrl, ulkeIstasyonSluglari, doluUlkeler,
  SAAT_DILIMI, type UlkeKodu,
} from "@/lib/ulkeler";
import UlkeCanli from "@/components/UlkeCanli";
import YerelSaat from "@/components/YerelSaat";
import UlkeGomKodu from "@/components/UlkeGomKodu";

/* Ülke sayfası gövdesi — TR (/ulke/x) ve EN (/en/country/x) rotaları bunu kullanır. */

const DEFAULT_ACCENT = "#6b7280";

function readableOn(hex: string): string {
  const h = (hex || DEFAULT_ACCENT).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#050505" : "#ffffff";
}

/* Ablatif eki — büyük ünlü uyumu (son ünlüye göre -dan/-den). */
function dan(ad: string): string {
  if (ad === "ABD") return "ABD'den";
  const unluler = [...ad.toLowerCase()].filter((c) => "aeıioöuü".includes(c));
  const son = unluler[unluler.length - 1] ?? "e";
  return `${ad}'${"aıou".includes(son) ? "dan" : "den"}`;
}

type St = { slug: string; name: string; city: string | null; frequency: string | null; accent_color: string | null; genre: string | null };

export async function ulkeIstasyonlari(kod: UlkeKodu): Promise<St[]> {
  const sluglar = ulkeIstasyonSluglari(kod);
  if (sluglar.length === 0) return [];
  try {
    const supa = getSupabase();
    const { data } = await supa
      .from("stations")
      .select("slug, name, city, frequency, accent_color, genre")
      .in("slug", sluglar)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as St[];
  } catch {
    return [];
  }
}

export function ulkeBaslik(kod: UlkeKodu, dil: "tr" | "en"): string {
  const u = ULKELER[kod];
  if (dil === "en") return kod === "www" ? "Internet-only Radio" : `${u.en} Radio Stations`;
  return kod === "www" ? "İnternet Radyoları" : `${u.tr} Radyoları`;
}

export default async function UlkeSayfasi({ kod, dil }: { kod: UlkeKodu; dil: "tr" | "en" }) {
  const u = ULKELER[kod];
  const stations = await ulkeIstasyonlari(kod);
  const bayrak = bayrakUrl(kod);
  const baslik = ulkeBaslik(kod, dil);
  const en = dil === "en";
  const kokUrl = en ? "/en/countries" : "/ulke";
  const sayfaUrl = (k: UlkeKodu) => (en ? `/en/country/${ulkeSlugEn(k)}` : `/ulke/${ulkeSlug(k)}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${baslik} — ŞİMDİ`,
    url: `https://necaliyor.co${sayfaUrl(kod)}`,
    inLanguage: en ? "en" : "tr",
    hasPart: stations.slice(0, 30).map((s) => ({
      "@type": "RadioStation",
      name: s.name,
      url: `https://necaliyor.co/radyo/${s.slug}`,
    })),
  };

  return (
    <div className="spread min-h-screen" lang={dil}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <Link href={kokUrl} className="text-sm underline" style={{ color: "var(--muted)" }}>
            ← atlas
          </Link>
          <span className="flex items-center gap-3">
            <Link
              href={en ? `/ulke/${ulkeSlug(kod)}` : `/en/country/${ulkeSlugEn(kod)}`}
              className="text-xs underline"
              style={{ color: "var(--muted)" }}
            >
              {en ? "TR" : "EN"}
            </Link>
            <Link href="/" className="brand text-sm font-bold tracking-tight">ŞİMDİ</Link>
          </span>
        </header>

        <div className="flex items-center gap-3">
          {bayrak ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bayrak} alt="" width={40} height={30} className="rounded-[4px] border" style={{ borderColor: "var(--line)" }} />
          ) : (
            <span className="text-3xl" aria-hidden>🌐</span>
          )}
          <h1 className="brand text-4xl font-bold tracking-tight">{baslik}</h1>
        </div>
        {SAAT_DILIMI[kod] && (
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            {en ? "local time: " : "yerel saat: "}<YerelSaat tz={SAAT_DILIMI[kod]!} dil={dil} />
          </p>
        )}
        <p className="epigraf mt-3 text-[15px]">
          {en
            ? kod === "www"
              ? "Stations that live only on the internet — no frequencies, no borders."
              : `Hand-picked stations from ${u.en} — tap one, tune into that country's now.`
            : kod === "www"
              ? "Yalnızca internette yaşayan istasyonlar — frekansları yok, sınırları da."
              : `${dan(u.tr)} seçme istasyonlar — dokun, o ülkenin şu an'ına bağlan.`}
        </p>

        {/* Canlı şerit — şu an bu ülkede çalanlar */}
        <UlkeCanli sluglar={stations.map((s) => s.slug)} baslik={en ? "playing in this country right now" : "şu an bu ülkede çalanlar"} />

        <section className="mt-8">
          <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            {stations.length} {en ? "stations" : "istasyon"}
          </h2>
          <div className="flex flex-col">
            {stations.map((s) => {
              const c = s.accent_color || DEFAULT_ACCENT;
              return (
                <Link
                  key={s.slug}
                  href={`/radyo/${s.slug}`}
                  className="press flex items-center gap-3 border-b py-3"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 50%, #000))`, color: readableOn(c) }}
                  >
                    {s.name.trim().charAt(0).toLocaleUpperCase("tr")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{s.name}</span>
                    <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>
                      {[s.genre, s.city || s.frequency].filter(Boolean).join(" · ") || (en ? "live" : "canlı")}
                    </span>
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{en ? "listen →" : "dinle →"}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Siteme ekle — ülke rozeti gömme kodu */}
        <UlkeGomKodu kod={kod} baslik={baslik} dil={dil} />

        {/* Diğer ülkeler — atlas ağı */}
        <nav className="mt-10">
          <h2 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            {en ? "other countries" : "diğer ülkeler"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {doluUlkeler().filter((k) => k !== kod).map((k) => {
              const b = bayrakUrl(k);
              return (
                <Link
                  key={k}
                  href={sayfaUrl(k)}
                  className="press flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                  style={{ borderColor: "var(--line)", color: "var(--fg)" }}
                >
                  {b ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b} alt="" width={18} height={13} className="rounded-[2px]" loading="lazy" />
                  ) : (
                    <span aria-hidden>🌐</span>
                  )}
                  {en ? ULKELER[k].en : ULKELER[k].tr}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
