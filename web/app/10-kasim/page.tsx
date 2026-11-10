import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

// 10 Kasım 2026 sabahı, 08.50–09.15 arası Türkiye radyolarının gönderdiği şarkı bilgisinden
// (plays tablosu) ELLE ayıklandı: yalnız adında açıkça 10 Kasım / Atatürk / siren / İstiklal
// Marşı geçen kayıtlar. Bozuk karakterler düzeltildi; başka hiçbir şey eklenmedi.
const KAYITLAR: { saat: string; slug: string; radyo: string; parca: string }[] = [
  { saat: "08.50", slug: "borusan-klasik", radyo: "Borusan Klasik", parca: "Henri Seroka — Valse du Palais 1" },
  { saat: "08.52", slug: "max-fm", radyo: "Max FM", parca: "Özdemir Erdoğan — Kırmızı Gülün Alı Var" },
  { saat: "08.53", slug: "borusan-klasik", radyo: "Borusan Klasik", parca: "Henri Seroka — Atatürk, Tema No. 2 (Sunrise)" },
  { saat: "08.55", slug: "borusan-klasik", radyo: "Borusan Klasik", parca: "Ediz Hafızoğlu, Ercüment Orkut — Cumhuriyet Çocukları (10 Kasım 1938 / Atatürk'ün Son Yolculuğu)" },
  { saat: "08.56", slug: "max-fm", radyo: "Max FM", parca: "Ediz Hafızoğlu — Cumhuriyet Çocukları" },
  { saat: "08.58", slug: "max-fm", radyo: "Max FM", parca: "Henri Seroka — École Militaire 2" },
  { saat: "08.59", slug: "max-fm", radyo: "Max FM", parca: "Atatürkiye (10 Kasım özel)" },
  { saat: "09.00", slug: "borusan-klasik", radyo: "Borusan Klasik", parca: "Tuluyhan Uğurlu — Prolog (Yıldızın Parladığı An) / Mustafa Kemal Atatürk & Güneşin Askerleri" },
  { saat: "09.02", slug: "borusan-klasik", radyo: "Borusan Klasik", parca: "Ediz Hafızoğlu, Ercüment Orkut — Saat 09.05 / 10 Kasım 1938" },
  { saat: "09.04", slug: "erzincan-cem-radyo", radyo: "Erzincan Cem Radyo", parca: "Siren ve İstiklal Marşı" },
  { saat: "09.05", slug: "park-fm", radyo: "Park FM", parca: "Siren ve İstiklal Marşı" },
  { saat: "09.05", slug: "radyo-karadeniz", radyo: "Radyo Karadeniz", parca: "Siren" },
  { saat: "09.05", slug: "dinamo-fm-legacy", radyo: "dinamo.fm legacy", parca: "Siren" },
  { saat: "09.07", slug: "metro-fm", radyo: "Metro FM", parca: "Atatürkiye" },
  { saat: "09.07", slug: "radio-mydonose", radyo: "Mydonose", parca: "Atatürkiye" },
  { saat: "09.07", slug: "pal-station", radyo: "Pal Station", parca: "Atatürkiye" },
  { saat: "09.07", slug: "borusan-klasik", radyo: "Borusan Klasik", parca: "TSK Armoni Mızıkası — Atatürk'ün Yolu Marşı" },
  { saat: "09.07", slug: "joy-fm", radyo: "Joy FM", parca: "Maria del Mar Bonet — 10 Kasım (A les portes de l'oblit)" },
  { saat: "09.07", slug: "radyo-karadeniz", radyo: "Radyo Karadeniz", parca: "Ediz Hafızoğlu — 10 Kasım 1938" },
  { saat: "09.08", slug: "erzincan-cem-radyo", radyo: "Erzincan Cem Radyo", parca: "Cengiz Özkan — Ağlayalım Atatürk'e" },
  { saat: "09.10", slug: "borusan-klasik", radyo: "Borusan Klasik", parca: "10 Kasım özel — Müzik Mutfağı, Gaye Çağlayan" },
  { saat: "09.11", slug: "max-fm", radyo: "Max FM", parca: "Ediz Hafızoğlu — Bayraklar Yarıda" },
  { saat: "09.12", slug: "max-fm", radyo: "Max FM", parca: "Ediz Hafızoğlu — Atatürk'ü Görmek" },
  { saat: "09.12", slug: "can-radyo", radyo: "Can Radyo", parca: "10 Kasım, Mustafa Kemal" },
];

export const metadata: Metadata = {
  title: "10 Kasım, 09.05 — radyolar ne çaldı | nowby.",
  description: "10 Kasım 2026 sabahı, 08.50 ile 09.15 arasında Türkiye'deki radyoların yayınla gönderdiği şarkı bilgisi.",
  alternates: { canonical: "/10-kasim" },
};

export default function OnKasim() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="brand text-[17px] font-semibold tracking-tight">
            nowby<span style={{ color: "var(--glow)" }}>.</span>
          </Link>
          <span className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
            <ThemeToggle />
          </span>
        </header>

        <p className="mb-3 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--glow)" }}>
          10 Kasım 2026
        </p>
        <h1 className="brand mb-6 text-5xl font-bold leading-[1.05] tracking-tight">09.05</h1>

        <div className="read mb-12 flex flex-col gap-4 text-[18px] leading-relaxed" style={{ color: "var(--fg)" }}>
          <p>
            Bu sabah 08.50 ile 09.15 arasında radyoların yayınla birlikte gönderdiği şarkı bilgisi.
            Saat, radyo ve parça; hepsi o dakikada kaydedildiği gibi.
          </p>
          <p>
            09.07&apos;de üç radyo aynı şarkıyı çalıyordu: <em>Atatürkiye</em>.
          </p>
        </div>

        <ol className="flex flex-col">
          {KAYITLAR.map((k, i) => (
            <li
              key={i}
              className="grid grid-cols-[3.5rem_1fr] gap-x-4 border-t py-4"
              style={{ borderColor: "color-mix(in srgb, var(--muted) 25%, transparent)" }}
            >
              <span className="tabular-nums text-sm" style={{ color: k.saat === "09.05" ? "var(--glow)" : "var(--muted)" }}>
                {k.saat}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[17px] leading-snug" style={{ color: "var(--fg)" }}>{k.parca}</span>
                <Link href={`/radyo/${k.slug}`} prefetch={false} className="text-sm underline-offset-4 hover:underline" style={{ color: "var(--muted)" }}>
                  {k.radyo}
                </Link>
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Birçok radyo saygı duruşunu ve İstiklal Marşı&apos;nı şarkı bilgisini değiştirmeden yayımladı.
          Bu liste yalnız görünen kısmı gösteriyor; burada adı geçmeyen bir radyo anmadı demek değildir.
        </p>
      </div>
    </div>
  );
}
