"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { sarkiSlug } from "@/lib/seoslug";

type Satir = { artist: string; title: string; kez: number; istasyon: number };

// ŞİMDİ LİSTESİ — Türkiye radyolarının canlı hit listesi. Veri: plays arşivi.
export default function Liste() {
  const [aralik, setAralik] = useState<"gun" | "hafta">("gun");
  const [q, setQ] = useState("");
  const [aranan, setAranan] = useState("");
  const [satirlar, setSatirlar] = useState<Satir[]>([]);
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "bos" | "hata">("yukleniyor");
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    setDurum("yukleniyor");
    const url = `/api/liste?a=${aralik}${aranan ? `&q=${encodeURIComponent(aranan)}` : ""}`;
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s: Satir[] = d.satirlar ?? [];
        setSatirlar(s);
        setDurum(d.error ? "hata" : s.length ? "hazir" : "bos");
      })
      .catch(() => setDurum("hata"));
  }, [aralik, aranan]);

  const toplamKez = satirlar.reduce((t, s) => t + Number(s.kez), 0);
  const araliktext = aralik === "gun" ? "son 24 saatte" : "bu hafta";

  function sanatciKarnesi() {
    const metin = `📻 ${satirlar[0]?.artist ?? aranan} ${araliktext} Türkiye radyolarında ${toplamKez} kez çaldı.\nCanlı sayım: necaliyor.co/liste`;
    navigator.clipboard?.writeText(metin).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="brand text-4xl font-bold tracking-tight">ŞİMDİ LİSTESİ</h1>
            <p className="epigraf mt-2 text-[15px]">
              Türkiye radyolarında gerçekte ne çalıyor — canlı sayım, itiraz kabul etmez.
            </p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        {/* Aralık + sanatçı arama */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-full border" style={{ borderColor: "var(--line)" }}>
            {(["gun", "hafta"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAralik(a)}
                className="press px-4 py-2 text-sm font-semibold"
                style={
                  aralik === a
                    ? { background: "var(--fg)", color: "var(--bg)" }
                    : { color: "var(--muted)" }
                }
              >
                {a === "gun" ? "son 24 saat" : "bu hafta"}
              </button>
            ))}
          </div>
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setAranan(q.trim());
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="sanatçı ara — kaç kez çaldı?"
              className="w-full min-w-40 rounded-full border bg-transparent px-4 py-2 text-sm outline-none"
              style={{ borderColor: "var(--line)" }}
            />
            {aranan && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setAranan("");
                }}
                className="text-sm underline"
                style={{ color: "var(--muted)" }}
              >
                temizle
              </button>
            )}
          </form>
        </div>

        {/* Sanatçı karnesi */}
        {aranan && durum === "hazir" && (
          <div className="mb-6 rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
            <p className="text-lg">
              <strong>{satirlar[0]?.artist}</strong> {araliktext} Türkiye radyolarında{" "}
              <strong className="tabular-nums">{toplamKez}</strong> kez çaldı.
            </p>
            <button
              onClick={sanatciKarnesi}
              className="press hap-dolu mt-3"
            >
              {kopyalandi ? "kopyalandı ✓" : "sayacı kopyala 📻"}
            </button>
          </div>
        )}

        {durum === "yukleniyor" && <p className="epigraf">sayım sürüyor…</p>}
        {durum === "hata" && (
          <p className="epigraf">liste ısınıyor — birazdan yeniden dene.</p>
        )}
        {durum === "bos" && (
          <p className="epigraf">
            {aranan ? `"${aranan}" ${araliktext} radyolarda hiç çalmamış. 🤫` : "henüz veri yok."}
          </p>
        )}

        {/* Liste */}
        {durum === "hazir" && (
          <ol className="flex flex-col">
            {satirlar.map((s, i) => (
              <li
                key={`${s.artist}-${s.title}`}
                className="flex items-baseline gap-4 border-b py-3.5"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className={`mono w-8 shrink-0 text-right tabular-nums ${i < 3 ? "text-xl font-bold" : "text-sm"}`}
                  style={{ color: i < 3 ? "var(--fg)" : "var(--muted)" }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/sarki/${sarkiSlug(s.artist)}--${sarkiSlug(s.title)}`}
                    className={`block truncate font-semibold underline-offset-2 hover:underline ${i < 3 ? "text-lg" : "text-[15px]"}`}
                  >
                    {s.title}
                  </Link>
                  <Link
                    href={`/sanatci/${sarkiSlug(s.artist)}`}
                    className="block truncate text-sm underline-offset-2 hover:underline"
                    style={{ color: "var(--muted)" }}
                  >
                    {s.artist}
                  </Link>
                </span>
                <span className="mono shrink-0 text-right text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                  {s.kez} kez
                  <span className="block">{s.istasyon} istasyon</span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-8 text-xs" style={{ color: "var(--muted)" }}>
          Sayılar {aralik === "gun" ? "son 24 saatin" : "son 7 günün"} gerçek yayın arşivinden; ŞİMDİ
          355 istasyonu 25 saniyede bir dinler. Liste ~2 dakikada bir tazelenir.
        </p>
      </div>
    </div>
  );
}
