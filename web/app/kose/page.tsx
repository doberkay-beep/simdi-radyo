import Link from "next/link";
import type { Metadata } from "next";
import { DENEMELER, gununDenemesi } from "@/lib/denemeler";
import Muhur from "@/components/Muhur";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Köşe — denemeler | ŞİMDİ",
  description: "Radyo, dinlemek ve 'şimdi' üzerine kısa denemeler. Bir şairin köşesi.",
  alternates: { canonical: "/kose" },
};

function tarihTR(s: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s));
  } catch {
    return s;
  }
}

export default function Page() {
  const gunun = gununDenemesi();
  const digerleri = DENEMELER.filter((d) => d.slug !== gunun.slug);

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: "#9c5f7c" }}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">Köşe</h1>
            <p className="epigraf mt-2 text-[15px]">radyo, dinlemek ve &quot;şimdi&quot; üzerine.</p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        {/* Günün denemesi */}
        <Link href={`/kose/${gunun.slug}`} className="press row-in block rounded-2xl border p-6" style={{ borderColor: "var(--line)" }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            günün denemesi
          </div>
          <h2 className="brand mt-2 text-2xl font-bold tracking-tight">{gunun.baslik}</h2>
          <p className="read mt-2 text-lg italic" style={{ color: "var(--muted)" }}>
            {gunun.ozet}
          </p>
        </Link>

        {/* Diğer denemeler */}
        <ul className="mt-6 flex flex-col gap-3">
          {digerleri.map((d) => (
            <li key={d.slug}>
              <Link href={`/kose/${d.slug}`} className="press block rounded-xl border p-5" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="brand text-lg font-bold tracking-tight">{d.baslik}</h3>
                  <span className="shrink-0 text-xs" style={{ color: "var(--muted)" }}>
                    {tarihTR(d.tarih)}
                  </span>
                </div>
                <p className="read mt-1 text-[15px] italic" style={{ color: "var(--muted)" }}>
                  {d.ozet}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <Muhur />
      </div>
    </div>
  );
}
