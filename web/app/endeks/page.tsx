import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { endeksAylari, ayAdi, type EndeksOzet } from "@/lib/endeks";

// TÜRKİYE RADYO ENDEKSİ — aylık resmi rapor dizini. Basının link vereceği adres.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Türkiye Radyo Endeksi — radyolarda gerçekte en çok çalanlar | ŞİMDİ",
  description:
    "Türkiye radyolarının aylık karnesi: yüzlerce istasyonun canlı yayın arşivinden ayın şarkısı, ayın sanatçısı ve toplam çalma sayımı. Açık veri — gazeteciler alıntılayabilir.",
  alternates: { canonical: "/endeks" },
};

async function ozet(ay: string): Promise<EndeksOzet | null> {
  try {
    const { data } = await getSupabase().rpc("endeks_ozet", { p_ay: ay });
    return (data as EndeksOzet | null) ?? null;
  } catch { return null; }
}

export default async function Sayfa() {
  const aylar = endeksAylari();
  const kartlar = (await Promise.all(aylar.map(async (a) => ({ ay: a, o: await ozet(a) }))))
    .filter((k): k is { ay: string; o: EndeksOzet } => !!k.o);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
        <Link href="/" className="nav-link">ŞİMDİ</Link> · resmi aylık rapor
      </p>
      <h1 className="brand mt-2 text-4xl font-bold leading-tight">TÜRKİYE RADYO ENDEKSİ</h1>
      <p className="epigraf mt-3 text-base">
        Listeler niyet sayar; endeks gerçeği. Yüzlerce istasyonu 25 saniyede bir dinleyip
        her parça değişimini arşivliyoruz — bu sayfa o arşivin aylık karnesi.
      </p>

      <div className="mt-8 grid gap-4">
        {kartlar.map(({ ay, o }) => (
          <Link
            key={ay}
            href={`/endeks/${ay}`}
            className="press block rounded-2xl border p-5"
            style={{ borderColor: "var(--line-hi)", background: "color-mix(in srgb, var(--glow) 5%, var(--panel))" }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--glow-hi)" }}>
                {ayAdi(ay)}{o.devam ? " · canlı sayım sürüyor" : ""}
              </span>
              <span className="mono text-[11px]" style={{ color: "var(--muted)" }}>
                {o.toplam.toLocaleString("tr-TR")} çalma
              </span>
            </div>
            {o.liste[0] && (
              <p className="mt-2 text-lg font-semibold">
                {o.liste[0].artist} — {o.liste[0].title}
                <span className="ml-2 text-sm font-normal" style={{ color: "var(--muted)" }}>ayın şarkısı</span>
              </p>
            )}
            {o.sanatci && (
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Ayın sanatçısı: <strong style={{ color: "var(--fg)" }}>{o.sanatci.ad}</strong> · ilk 25&apos;te {o.sanatci.kez} çalınma
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Yöntem notu: 1 Ekim 2026'dan önce toplayıcı aralıklı çalışıyordu (GitHub Actions,
          ~68 dk gecikme) ve bazı istasyonlar yanlışlıkla kapalıydı; 30 Eyl'de sunucuya taşındı. */}
      <p className="mt-4 rounded-2xl border p-4 text-sm leading-relaxed" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        <strong style={{ color: "var(--fg)" }}>📏 Yöntem notu:</strong> 1 Ekim 2026&apos;dan itibaren sayım
        7/24 kesintisiz yapılıyor. Ağustos ve Eylül 2026 sayımları aralıklı örneklemedir; bu yüzden
        ay toplamları birbiriyle karşılaştırılamaz, sıralamalar karşılaştırılabilir.
      </p>

      <section className="mt-10 rounded-2xl border p-5" style={{ borderColor: "var(--line-hi)" }}>
        <h2 className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--glow-hi)" }}>
          📂 Açık veri
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Her ayın ham verisi herkese açık JSON olarak sunulur:{" "}
          <code className="mono text-xs">necaliyor.co/endeks/YYYY-AA/veri</code>. Gazeteciler ve
          araştırmacılar serbestçe kullanabilir; kaynak gösterimi:{" "}
          <em>&quot;necaliyor.co Türkiye Radyo Endeksi&quot;</em>. Yöntem: yalnız Türkiye bandı,
          en az 2 istasyonda çalınan şarkılar; jingle ve tekrar otomasyonları elenir.
          İletişim: do.berkay@icloud.com
        </p>
      </section>

      <p className="mono mt-8 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
        <Link href="/liste" className="nav-link">canlı liste →</Link>{" "}
        <Link href="/rekorlar" className="nav-link">rekorlar →</Link>
      </p>
    </main>
  );
}
