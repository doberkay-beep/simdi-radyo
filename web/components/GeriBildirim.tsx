"use client";

import { useState } from "react";
import { useDil } from "@/lib/i18n";

/* Topluluk geri bildirimi:
   - mod "yanlis": istasyon sayfasında tek dokunuş "yanlış şarkı yazıyor" bildirimi
   - mod "oner":  hakkında sayfasında yeni istasyon önerme kutusu
   Kayıtlar kimseye gösterilmez; yalnız Berkay SQL'den okur. */

export function YanlisSarki({ slug }: { slug: string }) {
  const { t } = useDil();
  const [durum, setDurum] = useState<"bos" | "gitti">("bos");

  async function bildir() {
    if (durum === "gitti") return;
    setDurum("gitti");
    try {
      await fetch("/api/geri-bildirim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tur: "yanlis-sarki", slug, mesaj: `yanlış şarkı bildirimi: ${slug}` }),
      });
    } catch { /* yoksay */ }
  }

  return (
    <button
      onClick={bildir}
      className="press text-xs underline"
      style={{ color: "var(--muted)" }}
      disabled={durum === "gitti"}
    >
      {durum === "gitti" ? t("gb.tesekkur") : t("gb.yanlis")}
    </button>
  );
}

export function IstasyonOner() {
  const { t } = useDil();
  const [metin, setMetin] = useState("");
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "gitti" | "hata">("bos");

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    const m = metin.trim();
    if (m.length < 2 || m.length > 300) return;
    setDurum("gonderiliyor");
    try {
      const r = await fetch("/api/geri-bildirim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tur: "istasyon-oner", mesaj: m }),
      });
      if (!r.ok) throw new Error();
      setDurum("gitti");
      setMetin("");
    } catch {
      setDurum("hata");
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {t("gb.onerBaslik")}
      </h2>
      <form onSubmit={gonder} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={metin}
          onChange={(e) => { setMetin(e.target.value); if (durum === "hata") setDurum("bos"); }}
          maxLength={300}
          placeholder={t("gb.onerYer")}
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          style={{ background: "transparent", borderColor: "var(--line)", color: "var(--fg)" }}
        />
        <button
          type="submit"
          disabled={durum === "gonderiliyor" || metin.trim().length < 2}
          className="press rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--fg)", color: "var(--bg)" }}
        >
          {t("gb.gonder")}
        </button>
      </form>
      {durum === "gitti" && <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>{t("gb.onerTesekkur")}</p>}
      {durum === "hata" && <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>{t("gb.hata")}</p>}
    </div>
  );
}
