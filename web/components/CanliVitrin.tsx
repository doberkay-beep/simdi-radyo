"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useDil } from "@/lib/i18n";

// CANLI VİTRİN — ana sayfada ayın endeks sayacı, son 3 saatin listesi ve keşif kartları.
// Veri: ana_ozet tablosunun TEK satırı (pg_cron 5/30 dk'da bir yazar; bkz. ana-ozet.sql).
// Sayaç, iki yenileme arasında NowList'in canlı akışından gelen gerçek şarkı
// değişimleriyle (Türkiye bandı, başlık gerçekten değişince) artar — tahmin yok.

type Sarki = { artist: string; title: string; kez: number; istasyon: number };
export type AnaOzet = {
  ay?: string;
  ay_toplam?: number;
  son3saat?: Sarki[];
  ay_ilk5?: Sarki[];
  ay_sanatci?: { ad: string; kez: number } | null;
  saat_guncel?: string;
};

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function ayAdi(ay: string | undefined, en: boolean) {
  if (!ay) return "";
  const [y, m] = ay.split("-").map(Number);
  return `${(en ? MONTHS : AYLAR)[m - 1]} ${y}`;
}

// Özet satırını çeker; dakikada bir tazeler (tek satır, önemsiz yük).
export function useAnaOzet() {
  const [veri, setVeri] = useState<AnaOzet | null>(null);
  useEffect(() => {
    let off = false;
    const al = () =>
      getSupabase()
        .from("ana_ozet")
        .select("veri")
        .eq("id", 1)
        .maybeSingle()
        .then(({ data }) => {
          if (!off && data?.veri) setVeri(data.veri as AnaOzet);
        });
    al();
    const id = setInterval(al, 60_000);
    return () => {
      off = true;
      clearInterval(id);
    };
  }, []);
  return veri;
}

// Sayı yumuşakça hedefe akar (artışlar göz önünde "sayılıyor" gibi).
function useAkanSayi(hedef: number) {
  const [g, setG] = useState(hedef);
  const gRef = useRef(hedef);
  useEffect(() => {
    let raf = 0;
    const adim = () => {
      const fark = hedef - gRef.current;
      if (Math.abs(fark) < 1) {
        gRef.current = hedef;
        setG(hedef);
        return;
      }
      gRef.current += Math.sign(fark) * Math.max(1, Math.abs(fark) * 0.12);
      setG(Math.round(gRef.current));
      raf = requestAnimationFrame(adim);
    };
    raf = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(raf);
  }, [hedef]);
  return g;
}

function Baslik({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
      {children}
    </h3>
  );
}

function CanliNokta() {
  return <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: "#e5382c", boxShadow: "0 0 10px #e5382c" }} />;
}

/* Ayın canlı endeks sayacı + ilk 5. `artis`: sayfa açıldığından beri gelen gerçek
   şarkı değişimi sayısı (NowList'ten). Özet her yenilendiğinde taban sıfırlanır. */
export function CanliSayac({ veri, artis, kisa = false }: { veri: AnaOzet | null; artis: number; kisa?: boolean }) {
  const { dil } = useDil();
  const en = dil === "en";
  const taban = useRef<{ toplam: number; artis: number } | null>(null);
  if (veri?.ay_toplam != null && (!taban.current || taban.current.toplam !== veri.ay_toplam)) {
    taban.current = { toplam: veri.ay_toplam, artis };
  }
  const hedef = taban.current ? taban.current.toplam + Math.max(0, artis - taban.current.artis) : 0;
  const sayi = useAkanSayi(hedef);
  if (!veri?.ay_toplam) return null;
  const ilk = (veri.ay_ilk5 ?? []).slice(0, kisa ? 3 : 5);

  return (
    <section lang={dil} className="surf p-4">
      <Baslik>
        <CanliNokta /> {ayAdi(veri.ay, en)} · {en ? "counting now" : "şu an sayılıyor"}
      </Baslik>
      <Link href="/endeks" className="block">
        <span className="brand block text-[40px] font-bold leading-none tabular-nums" style={{ color: "var(--glow-hi)" }}>
          {sayi.toLocaleString("tr-TR")}
        </span>
        <span className="mt-1 block text-[12px]" style={{ color: "var(--muted)" }}>
          {en ? "songs played on Turkish radio this month" : "bu ay Türkiye radyolarında çalınan şarkı"}
        </span>
      </Link>
      {ilk.length > 0 && (
        <ol className="mt-4 flex flex-col gap-1.5">
          {ilk.map((s, i) => (
            <li key={`${s.artist}-${s.title}`} className="flex items-baseline gap-2 text-[13px]">
              <span className="mono w-4 shrink-0 text-right text-[11px]" style={{ color: i === 0 ? "var(--glow-hi)" : "var(--muted)" }}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">
                <strong>{s.artist}</strong> <span style={{ color: "var(--muted)" }}>— {s.title}</span>
              </span>
              <span className="mono shrink-0 text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>{s.kez}</span>
            </li>
          ))}
        </ol>
      )}
      <Link href="/endeks" className="mono mt-3 inline-block text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--glow-hi)" }}>
        {en ? "radio index →" : "radyo endeksi →"}
      </Link>
    </section>
  );
}

/* Son 3 saatte en çok çalanlar — sıra değişimi okla gösterilir. */
export function CanliListe({ veri, kisa = false }: { veri: AnaOzet | null; kisa?: boolean }) {
  const { dil } = useDil();
  const en = dil === "en";
  const onceki = useRef<Map<string, number>>(new Map());
  const [degisim, setDegisim] = useState<Map<string, number>>(new Map());
  const liste = (veri?.son3saat ?? []).slice(0, kisa ? 5 : 10);
  const imza = liste.map((s) => `${s.artist}|${s.title}`).join(",");

  useEffect(() => {
    const yeni = new Map<string, number>();
    liste.forEach((s, i) => yeni.set(`${s.artist}|${s.title}`, i));
    const d = new Map<string, number>();
    if (onceki.current.size) {
      yeni.forEach((i, k) => {
        const o = onceki.current.get(k);
        d.set(k, o == null ? 99 : o - i); // 99 = listeye yeni girdi
      });
    }
    onceki.current = yeni;
    setDegisim(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imza]);

  if (liste.length === 0) return null;
  return (
    <section lang={dil} className="surf p-4">
      <Baslik>
        <CanliNokta /> {en ? "most played · last 3 hours" : "son 3 saatte en çok çalanlar"}
      </Baslik>
      <ol className="flex flex-col gap-1.5">
        {liste.map((s, i) => {
          const k = `${s.artist}|${s.title}`;
          const d = degisim.get(k) ?? 0;
          return (
            <li key={k} className="flex items-baseline gap-2 text-[13px]">
              <span className="mono w-4 shrink-0 text-right text-[11px]" style={{ color: i < 3 ? "var(--glow-hi)" : "var(--muted)" }}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">
                <strong>{s.artist}</strong> <span style={{ color: "var(--muted)" }}>— {s.title}</span>
              </span>
              <span className="mono w-6 shrink-0 text-right text-[10px]" style={{ color: d > 0 ? "#3ddc84" : d < 0 ? "#e5382c" : "var(--faint)" }}>
                {d === 99 ? (en ? "new" : "yeni") : d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : "·"}
              </span>
            </li>
          );
        })}
      </ol>
      <Link href="/liste" className="mono mt-3 inline-block text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--glow-hi)" }}>
        {en ? "full chart →" : "tam liste →"}
      </Link>
    </section>
  );
}
