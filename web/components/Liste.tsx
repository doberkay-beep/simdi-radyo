"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { sarkiSlug } from "@/lib/seoslug";
import { ULKELER, doluUlkeler, ulkeIstasyonSluglari, bayrakEmoji, type UlkeKodu } from "@/lib/ulkeler";

type Satir = { artist: string; title: string; kez: number; istasyon: number };

// Ülke şeridi: önce Türkiye, sonra Dünya (bütün radyolar), sonra radyo sayısına göre ülkeler.
// Uygulamadaki bayrak şeridiyle aynı veri; seçim adrese yazılır (/liste?ulke=jp), paylaşılabilir.
type Secim = UlkeKodu | "hepsi";
const SAYI = Object.fromEntries(doluUlkeler().map((k) => [k, ulkeIstasyonSluglari(k).length])) as Record<UlkeKodu, number>;
const SERIT: Secim[] = [
  "tr",
  "hepsi",
  ...doluUlkeler().filter((k) => k !== "tr" && k !== "www").sort((a, b) => SAYI[b] - SAYI[a] || ULKELER[a].sira - ULKELER[b].sira),
];
const TOPLAM = Object.values(SAYI).reduce((t, n) => t + n, 0);
const ad = (k: Secim) => (k === "hepsi" ? "Dünya" : ULKELER[k].tr);

// nowby. LİSTESİ — radyoların canlı hit listesi, ülke ülke. Veri: plays arşivi.
export default function Liste() {
  const [ulke, setUlke] = useState<Secim>("tr");
  const [aralik, setAralik] = useState<"gun" | "hafta">("gun");
  const [q, setQ] = useState("");
  const [aranan, setAranan] = useState("");
  const [satirlar, setSatirlar] = useState<Satir[]>([]);
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "bos" | "hata">("yukleniyor");
  const [kopyalandi, setKopyalandi] = useState(false);

  // Adresteki ?ulke= ile aç; seçim değişince adresi güncelle (sayfa yeniden yüklenmez).
  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("ulke");
    if (k && (k === "hepsi" || SERIT.includes(k as Secim))) setUlke(k as Secim);
  }, []);
  function ulkeSec(k: Secim) {
    setUlke(k);
    setQ("");
    setAranan("");
    const u = new URL(window.location.href);
    if (k === "tr") u.searchParams.delete("ulke"); else u.searchParams.set("ulke", k);
    window.history.replaceState(null, "", u);
  }

  useEffect(() => {
    setDurum("yukleniyor");
    // Sanatçı araması yalnız Türkiye listesinde (sayaç Türkiye arşivinden).
    const url = aranan
      ? `/api/liste?a=${aralik}&q=${encodeURIComponent(aranan)}`
      : `/api/liste?a=${aralik}&ulke=${ulke}`;
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s: Satir[] = d.satirlar ?? [];
        setSatirlar(s);
        setDurum(d.error ? "hata" : s.length ? "hazir" : "bos");
      })
      .catch(() => setDurum("hata"));
  }, [aralik, aranan, ulke]);

  const toplamKez = satirlar.reduce((t, s) => t + Number(s.kez), 0);
  const araliktext = aralik === "gun" ? "son 24 saatte" : "bu hafta";

  function sanatciKarnesi() {
    const metin = `📻 ${satirlar[0]?.artist ?? aranan} ${araliktext} Türkiye radyolarında ${toplamKez} kez çaldı.\nCanlı sayım: nowby.co/liste`;
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
            <h1 className="brand text-4xl font-bold tracking-tight">nowby. LİSTESİ</h1>
            <p className="epigraf mt-2 text-[15px]">
              {ulke === "hepsi" ? "Dünyanın radyolarında" : `${ad(ulke)} radyolarında`} gerçekte ne çalıyor — canlı sayım, itiraz kabul etmez.
            </p>
          </div>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </span>
        </header>

        {/* Ülke şeridi */}
        <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
          {SERIT.map((k) => (
            <button
              key={k}
              onClick={() => ulkeSec(k)}
              aria-pressed={ulke === k}
              className="press flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold"
              style={
                ulke === k
                  ? { background: "var(--fg)", color: "var(--bg)", borderColor: "var(--fg)" }
                  : { borderColor: "var(--line)" }
              }
            >
              <span aria-hidden>{k === "hepsi" ? "🌍" : bayrakEmoji(k)}</span>
              {ad(k)}
              {k !== "hepsi" && <span className="mono text-xs opacity-60">{SAYI[k]}</span>}
            </button>
          ))}
        </div>

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
          {ulke === "tr" && <form
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
          </form>}
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
            {aranan ? `"${aranan}" ${araliktext} radyolarda hiç çalmamış. 🤫` : ulke === "tr" ? "henüz veri yok." : "bu ülkede henüz yeterince çalma yok — biraz sonra yine bak."}
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
                    className="block truncate text-sm underline decoration-dotted underline-offset-4"
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
          Sayılar {aralik === "gun" ? "son 24 saatin" : "son 7 günün"} gerçek yayın arşivinden; nowby{" "}
          {ulke === "hepsi" ? TOPLAM : ulke === "tr" ? SAYI.tr : SAYI[ulke]} istasyonu 25 saniyede bir dinler.{" "}
          {ulke === "tr"
            ? "Liste ~2 dakikada bir tazelenir."
            : "Bir radyonun aynı şarkıya katkısı günde en fazla 3 çalma sayılır; önce en az iki radyoda çalanlar. Liste ~10 dakikada bir tazelenir."}
        </p>
      </div>
    </div>
  );
}
