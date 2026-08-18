import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Hakkında — ŞİMDİ",
  description: "ŞİMDİ neden var? Bir yazarın radyo girişiminin küçük hikâyesi.",
  alternates: { canonical: "/hakkinda" },
};

export default function Hakkinda() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              ŞİMDİ <span style={{ color: "var(--muted)" }}>· hakkında</span>
            </h1>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        <div
          className="flex flex-col gap-5 text-[17px] leading-relaxed"
          style={{ color: "var(--fg)" }}
        >
          <p>
            <strong>ŞİMDİ</strong>, basit bir merakın ürünü: şu anda radyoda ne çalıyor?
            Onlarca istasyonu tek tek gezmek yerine, hepsinin o an çaldığı parçayı tek bir
            ekranda, canlı görmek istedim.
          </p>
          <p>
            Yazıyla uğraşan biriyim. Kelimelerden sonra bir süredir seslerle de uğraşıyorum;
            bu proje o merakın koda dönüşmüş hâli. Türkiye&apos;nin dört bir yanından radyolar —
            türkü, arabesk, klasik, caz, rock, pop, nostalji — ve seçme birkaç yabancı, hepsi
            burada. Bir istasyona dokun; hem dinle, hem o an çalan parçayı gör.
          </p>
          <p>
            Bir de kalıcı bir <Link href="/arsiv" className="underline" style={{ color: "var(--fg)" }}>arşiv</Link>{" "}
            var: &ldquo;dün gece şu saatte ne çalıyordu?&rdquo; diye geriye dönüp bakabilirsin.
            Çünkü bir şarkının çaldığı an da, o anı hatırlamak da kıymetli.
          </p>
          <p style={{ color: "var(--muted)" }}>
            Önce kelimeler, şimdi frekanslar. Bir eksik, bir öneri, bir istasyon isteği olursa
            duymak isterim.
          </p>
        </div>

        <div className="mt-12 border-t pt-6 text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
          <Link href="/" className="underline" style={{ color: "var(--fg)" }}>
            necaliyor.co
          </Link>{" "}
          — radyoda şu an ne çalıyor
        </div>
      </div>
    </div>
  );
}
