"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDil } from "@/lib/i18n";
import ToneToggle from "./ToneToggle";

// Site-geneli künye — her sayfanın altında. ŞİMDİ'nin bir yazar projesi
// olduğunu söyler ve berkaydogan.co'ya (aynı kişi → funnel + entity) bağlar.
// rel="me": iki siteyi aynı kişinin sahiplendiğini arama motorlarına bildirir.
// Gömme (/embed) sayfalarında gösterilmez — rozet iframe'i temiz kalsın.
export default function AltBilgi() {
  const yol = usePathname();
  const { dil } = useDil();
  const en = dil === "en";
  if (yol?.startsWith("/embed")) return null;

  return (
    <footer className="mx-auto max-w-2xl px-5 pb-16 pt-4 text-sm" style={{ color: "var(--muted)" }}>
      <div className="border-t pt-6" style={{ borderColor: "var(--line)" }}>
        <p>
          <span className="brand font-bold" style={{ color: "var(--fg)" }}>
            ŞİMDİ
          </span>{" "}
          — {en ? "a radio project by the writer " : "bir yazarın radyo projesi · "}
          <a
            href="https://berkaydogan.co"
            target="_blank"
            rel="me noopener"
            className="underline"
            style={{ color: "var(--fg)" }}
          >
            Berkay Doğan
          </a>
        </p>
        {/* Mini site haritası — üst menünün katlamasında kaybolanlar burada göz önünde */}
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          <Link href="/hakkinda" className="underline">
            {en ? "about" : "hakkında"}
          </Link>
          <Link href="/hakkinda#film" className="underline">
            {en ? "the film 🕯" : "film 🕯"}
          </Link>
          <Link href="/oyun" className="underline">
            {en ? "games" : "oyunlar"}
          </Link>
          <Link href="/fal" className="underline">
            {en ? "fortune 🔮" : "fal 🔮"}
          </Link>
          <Link href="/liste" className="underline">
            {en ? "the chart" : "liste"}
          </Link>
          <Link href="/arsiv" className="underline">
            {en ? "archive" : "arşiv"}
          </Link>
          <Link href="/kose" className="underline">
            {en ? "essays" : "köşe"}
          </Link>
          <Link href="/rozet" className="underline">
            {en ? "badge" : "rozet"}
          </Link>
        </p>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          {en ? "Words first, then frequencies." : "Önce kelimeler, sonra frekanslar."}
        </p>
        <div className="mt-4 flex items-center gap-2.5">
          <span className="mono text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            {en ? "tone" : "ton"}
          </span>
          <ToneToggle />
        </div>
      </div>
    </footer>
  );
}
