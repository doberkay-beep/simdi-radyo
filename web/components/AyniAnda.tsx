import Link from "next/link";
import { anTarihi, yerelSaatler, type DunyaAni } from "@/lib/dunyaAnlari";

// AYNI ANDA — dünyanın rastlantıları. Senkron Defteri'nin (Türkiye içi) kıtalar arası kardeşi.
const METIN = {
  tr: {
    ust: "dünyanın rastlantıları",
    baslik: "AYNI ANDA",
    giris: "Radyolar birbirini duymaz. Kopenhag'daki bir yayıncı Santiago'dakini tanımaz. Ama bazen, farklı kıtalarda, aynı dakikalarda aynı şarkı çalar. Kimse anlaşmamıştır; bir liste de, bir algoritma da değil. O anlar burada kayıtlı.",
    kural: (n: number) => `kural: aynı şarkı · 5 dakika içinde · en az 3 ülke, 2 kıta · hitler ve aynı yayın ağı sayılmaz · son 30 günde ${n} an`,
    saatNotu: "Saatler her radyonun kendi ülkesinde.",
    bos: "Henüz kayıt yok. Nadir olmasının güzelliği bu.",
    senkron: "Türkiye'nin radyoları arasındaki anlar: Senkron Defteri →",
    senkronHref: "/senkron",
  },
  en: {
    ust: "the world's coincidences",
    baslik: "SAME TIME",
    giris: "Radio stations can't hear each other. A broadcaster in Copenhagen doesn't know the one in Santiago. But sometimes, on different continents, the same song plays within the same few minutes. No one agreed on it; not a chart, not an algorithm. Those moments are recorded here.",
    kural: (n: number) => `rule: same song · within 5 minutes · at least 3 countries, 2 continents · hits and shared networks don't count · ${n} in the last 30 days`,
    saatNotu: "Times are local to each station's country.",
    bos: "Nothing recorded yet. That's the beauty of rare.",
    senkron: "Moments between Türkiye's stations: Sync Moments →",
    senkronHref: "/senkron",
  },
};

export default function AyniAnda({ anlar, dil }: { anlar: DunyaAni[]; dil: "tr" | "en" }) {
  const m = METIN[dil];
  const ay = anlar.filter((a) => Date.parse(a.zaman) > Date.now() - 30 * 864e5).length;
  return (
    <main className="mx-auto max-w-2xl px-5 py-10" lang={dil}>
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
        <Link href={dil === "tr" ? "/" : "/en"} className="nav-link">nowby.</Link> · {m.ust}
      </p>
      <h1 className="brand mt-2 text-4xl font-bold leading-tight">🌍 {m.baslik}</h1>
      <p className="epigraf mt-3 text-base">{m.giris}</p>
      <p className="mono mt-3 text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>{m.kural(ay)}</p>

      <ol className="mt-8 grid gap-3">
        {anlar.map((a) => (
          <li key={a.id} className="min-w-0 overflow-hidden rounded-2xl border px-4 py-4" style={{ borderColor: "var(--line-hi)" }}>
            <p className="mono text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--glow-hi)" }}>{anTarihi(a.zaman, dil)}</p>
            <p className="mt-1 text-lg font-bold leading-snug">{a.artist} — {a.title}</p>
            <ul className="mt-2 grid min-w-0 gap-1">
              {yerelSaatler(a, dil).map((y) => (
                <li key={y.radyo} className="flex min-w-0 items-baseline gap-2 text-sm">
                  <span aria-hidden="true">{y.bayrak}</span>
                  <span className="shrink-0 font-semibold">{y.ulke}</span>
                  {y.saat && <span className="mono shrink-0" style={{ color: "var(--glow-hi)" }}>{y.saat}</span>}
                  <span className="min-w-0 truncate" style={{ color: "var(--muted)" }}>· {y.radyo}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {anlar.length === 0 && <p className="epigraf text-base">{m.bos}</p>}
      </ol>
      {anlar.length > 0 && <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>{m.saatNotu}</p>}
      <p className="mt-8 text-sm"><Link href={m.senkronHref} className="nav-link">{m.senkron}</Link></p>
    </main>
  );
}
