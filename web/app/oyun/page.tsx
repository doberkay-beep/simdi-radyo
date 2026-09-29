import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Oyunlar — kulağınla oyna | ŞİMDİ",
  description:
    "ŞİMDİ'nin radyo oyunları: Kör Dinleme'de istasyonu, Nereden Çalıyor?'da ülkeyi tahmin et. Kulağın ne kadar keskin?",
  alternates: { canonical: "/oyun" },
};

const OYUNLAR = [
  {
    href: "/oyun/kor-dinleme",
    ad: "Kör Dinleme",
    soru: "istasyon gizli — sadece ses. hangi radyo çalıyor?",
    emoji: "🎧",
  },
  {
    href: "/oyun/nereden",
    ad: "Nereden Çalıyor?",
    soru: "dünyadan bir radyo — hangi ülkeden yayında?",
    emoji: "🌍",
    yeni: true,
  },
];

export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <header className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">Oyunlar</h1>
            <p className="epigraf mt-2 text-[15px]">kulağınla oyna — frekanslar soru soruyor.</p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        <div className="grid gap-4">
          {OYUNLAR.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="press block rounded-2xl border p-6"
              style={{ borderColor: "var(--line)" }}
            >
              <p className="text-xl font-bold">
                <span className="mr-2" aria-hidden>{o.emoji}</span>
                {o.ad}
                {o.yeni && (
                  <span
                    className="mono ml-3 rounded-full border px-2 py-0.5 align-middle text-[10px] uppercase tracking-[0.16em]"
                    style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                  >
                    yeni
                  </span>
                )}
              </p>
              <p className="epigraf mt-1.5 text-[15px]">{o.soru}</p>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-sm" style={{ color: "var(--muted)" }}>
          Seri rekorların bu tarayıcıda saklanır — kimseyle yarışmıyorsun, kendi kulağınla yarışıyorsun.
        </p>
      </div>
    </div>
  );
}
