import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import DilToggle from "@/components/DilToggle";
import { gununDizesi } from "@/lib/sozler";
import { dilSunucu } from "@/lib/dil-sunucu";

export async function generateMetadata(): Promise<Metadata> {
  const dil = await dilSunucu();
  const en = dil === "en";
  return {
    title: en ? "About — ŞİMDİ" : "Hakkında — ŞİMDİ",
    description: en
      ? "Why does ŞİMDİ exist? The small story of a writer's radio project."
      : "ŞİMDİ neden var? Bir yazarın radyo girişiminin küçük hikâyesi.",
    alternates: { canonical: "/hakkinda" },
  };
}

export default async function Hakkinda() {
  const dil = await dilSunucu();
  const en = dil === "en";
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">
              ŞİMDİ <span style={{ color: "var(--muted)" }}>· {en ? "about" : "hakkında"}</span>
            </h1>
          </div>
          <span className="flex items-center gap-3">
            <DilToggle />
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              {en ? "← now" : "← şimdi"}
            </Link>
          </span>
        </header>

        <p className="dize mb-8 text-lg">{gununDizesi()}</p>

        <div
          className="read flex flex-col gap-5 text-[18px] leading-relaxed"
          style={{ color: "var(--fg)" }}
        >
          {en ? (
            <>
              <p className="dropcap">
                <strong>ŞİMDİ</strong> (Turkish for &ldquo;now&rdquo;) grew out of a simple
                curiosity: what is playing on the radio <em>right now</em>? Instead of hopping
                between dozens of stations, I wanted to see what each one was playing on a
                single screen, live.
              </p>
              <p>
                I work with words. For a while now I&apos;ve been working with sounds too —
                this project is that curiosity turned into code. Stations from every corner of
                Türkiye — türkü, arabesk, classical, jazz, rock, pop, nostalgia — plus a
                handpicked set from around the world, all in one place. Tap a station; listen,
                and see the song playing at that very moment.
              </p>
              <p>
                There is also a permanent{" "}
                <Link href="/arsiv" className="underline" style={{ color: "var(--fg)" }}>archive</Link>:
                you can go back and ask &ldquo;what was playing at that hour last night?&rdquo;
                Because the moment a song plays matters — and so does remembering it.
              </p>
              <p style={{ color: "var(--muted)" }}>
                First words, now frequencies. If something is missing — a suggestion, a station
                request — I&apos;d love to hear it.
              </p>
            </>
          ) : (
            <>
              <p className="dropcap">
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
            </>
          )}
        </div>

        <div className="mt-12 border-t pt-6 text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
          <p>
            {en ? "Built by" : "Geliştiren:"}{" "}
            <a
              href="https://berkaydogan.co"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--fg)" }}
            >
              Berkay Doğan
            </a>{" "}
            {en ? "— a writer who occasionally turns his curiosities into code." : "— yazar. Meraklarını arada koda döküyor."}
          </p>
          <p className="mt-2">
            <Link href="/" className="underline" style={{ color: "var(--fg)" }}>
              necaliyor.co
            </Link>{" "}
            {en ? "— what's playing on the radio right now" : "— radyoda şu an ne çalıyor"}
          </p>
        </div>
      </div>
    </div>
  );
}
