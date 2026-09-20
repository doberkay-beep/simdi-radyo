"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDil } from "@/lib/i18n";

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
          {" · "}
          <Link href="/hakkinda" className="underline">
            {en ? "about" : "hakkında"}
          </Link>
          {" · "}
          <Link href="/rozet" className="underline">
            {en ? "badge" : "rozet"}
          </Link>
        </p>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          {en ? "Words first, then frequencies." : "Önce kelimeler, sonra frekanslar."}
        </p>
      </div>
    </footer>
  );
}
