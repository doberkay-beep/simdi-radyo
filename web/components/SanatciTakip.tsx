"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { izlenenOku, izlenenDegistir, izleniyorMu } from "@/lib/avlar";
import { radarAc, radarAcikMi, radarDestekleniyor, radarEsitle } from "@/lib/radar";
import { kuruluMu } from "./KurSihirbazi";

// 🔔 SANATÇI TAKİP — sanatçını ara, takip et; Türkiye'de ya da dünyada
// herhangi bir radyoda çaldığı an telefonuna bildirim düşsün.
// Arama: sanatci_ara RPC (son 30 gün, Türkçe-dayanıklı). Takip: Müzik
// Defteri'nin izlenen listesi + Sanatçı Radarı push'u (aynı altyapı).

type Sonuc = { slug: string; ad: string; kez: number; istasyon: number; son: string };

// Radar nöbetçisiyle aynı katlama + düet bölme kuralı.
function katla(t: string): string {
  return t.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}
function ortaklar(ad: string): string[] {
  return ad.split(/\s+(?:feat\.?|ft\.?|featuring|x|vs\.?|ve|and|with)\s+|\s*[&,/+]\s*/i).map(katla).filter(Boolean);
}
// "Hadise, Murda" gibi düet satırlarını, listede tek başına "Hadise" varsa gizle —
// radar düetleri zaten ayrıştırıyor, "Hadise"yi takip etmek hepsini kapsar.
function duetleriSuz(liste: Sonuc[]): Sonuc[] {
  const tekler = new Set(liste.filter((s) => ortaklar(s.ad).length === 1).map((s) => katla(s.ad)));
  return liste.filter((s) => {
    const o = ortaklar(s.ad);
    return o.length === 1 || !o.some((p) => tekler.has(p));
  });
}

function once(t: string, en: boolean): string {
  const dk = Math.max(0, Math.floor((Date.now() - Date.parse(t)) / 60000));
  if (dk < 60) return en ? `${dk} min ago` : `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return en ? `${sa} h ago` : `${sa} saat önce`;
  const g = Math.floor(sa / 24);
  return en ? `${g} d ago` : `${g} gün önce`;
}

export default function SanatciTakip({
  acik, kapat, dil, kurAc,
}: { acik: boolean; kapat: () => void; dil: string; kurAc: () => void }) {
  const en = dil === "en";
  const [q, setQ] = useState("");
  const [sonuclar, setSonuclar] = useState<Sonuc[] | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [izlenenler, setIzlenenler] = useState<string[]>([]);
  const [radar, setRadar] = useState(false);
  const [radarMesaj, setRadarMesaj] = useState("");
  const girdiRef = useRef<HTMLInputElement>(null);
  const sayac = useRef(0);

  useEffect(() => {
    if (!acik) return;
    setIzlenenler(izlenenOku());
    setRadar(radarAcikMi());
    setRadarMesaj("");
    setTimeout(() => girdiRef.current?.focus(), 80);
  }, [acik]);

  // Yazdıkça ara (350 ms bekleme; eski cevap yeniyi ezmesin diye sayaç).
  useEffect(() => {
    const temiz = q.trim();
    if (temiz.length < 2) { setSonuclar(null); setYukleniyor(false); return; }
    setYukleniyor(true);
    const no = ++sayac.current;
    const zaman = setTimeout(async () => {
      try {
        const { data } = await getSupabase().rpc("sanatci_ara", { q: temiz });
        if (no === sayac.current) setSonuclar(duetleriSuz((data as Sonuc[]) ?? []));
      } catch {
        if (no === sayac.current) setSonuclar([]);
      } finally {
        if (no === sayac.current) setYukleniyor(false);
      }
    }, 350);
    return () => clearTimeout(zaman);
  }, [q]);

  if (!acik) return null;

  const iosKurulmamis = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !kuruluMu();

  const radariAc = async () => {
    if (iosKurulmamis) { kapat(); kurAc(); return; }
    const s = await radarAc();
    if (s === "acik") { setRadar(true); setRadarMesaj(en ? "Notifications on 🔔" : "Bildirimler açık 🔔"); }
    else if (s === "izin-yok") setRadarMesaj(en ? "Notification permission was denied — allow it in browser settings." : "Bildirim izni verilmedi — tarayıcı ayarlarından izin ver.");
    else if (s === "desteklenmiyor") setRadarMesaj(en ? "This browser can't receive notifications." : "Bu tarayıcı bildirim alamıyor.");
    else setRadarMesaj(en ? "Couldn't turn on, try again." : "Açılamadı, birazdan yine dene.");
  };

  const takipDegistir = async (ad: string) => {
    const yeni = izlenenDegistir(ad);
    setIzlenenler(yeni);
    radarEsitle().catch(() => {});
    // İlk takipte radar kapalıysa bildirimi hemen teklif et.
    if (!radar && izleniyorMu(yeni, ad) && radarDestekleniyor() && !iosKurulmamis) {
      await radariAc();
    }
  };

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-label={en ? "follow artists" : "sanatçı takip"}>
      <button className="absolute inset-0" style={{ background: "color-mix(in srgb, #000 62%, transparent)" }} onClick={kapat} aria-label={en ? "close" : "kapat"} />
      <div className="menu-sayfa absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl p-5 pb-8 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
        <div className="mb-3 flex items-center justify-between">
          <span className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            🔔 {en ? "FOLLOW ARTISTS" : "SANATÇI TAKİP"}
          </span>
          <button onClick={kapat} className="press text-xl leading-none" aria-label={en ? "close" : "kapat"}>×</button>
        </div>

        <input
          ref={girdiRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={en ? "search an artist… (e.g. Hadise)" : "sanatçı ara… (ör. Hadise)"}
          className="w-full rounded-xl border bg-transparent px-4 py-3 text-base"
          style={{ borderColor: "color-mix(in srgb, var(--glow) 45%, var(--line-hi))", color: "var(--fg)" }}
          autoComplete="off"
          spellCheck={false}
        />

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {yukleniyor && <p className="epigraf py-3 text-sm">{en ? "listening to the archive…" : "arşiv dinleniyor…"}</p>}

          {!yukleniyor && sonuclar && sonuclar.length === 0 && (
            <p className="py-3 text-sm" style={{ color: "var(--muted)" }}>
              {en ? "Not played on our stations in the last 30 days — you can still follow by name:" : "Son 30 günde istasyonlarımızda çalmamış — yine de adıyla takip edebilirsin:"}{" "}
              <button onClick={() => takipDegistir(q.trim())} className="nav-link font-semibold">
                {izleniyorMu(izlenenler, q.trim()) ? "✓ " : "+ "}{q.trim()}
              </button>
            </p>
          )}

          {!yukleniyor && sonuclar && sonuclar.length > 0 && (
            <ul className="grid gap-2">
              {sonuclar.map((s) => {
                const takipte = izleniyorMu(izlenenler, s.ad);
                return (
                  <li key={s.slug} className="menu-kalem justify-between">
                    <Link href={`/sanatci/${s.slug}`} className="min-w-0 flex-1" onClick={kapat}>
                      <span className="block truncate font-semibold">{s.ad}</span>
                      <span className="block truncate text-xs font-normal" style={{ color: "var(--muted)" }}>
                        {en
                          ? `${s.kez} plays · ${s.istasyon} stations · last ${once(s.son, true)}`
                          : `30 günde ${s.kez} kez · ${s.istasyon} istasyon · son ${once(s.son, false)}`}
                      </span>
                    </Link>
                    <button
                      onClick={() => takipDegistir(s.ad)}
                      className={`press shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${takipte ? "" : "hap-marka"}`}
                      style={takipte ? { background: "linear-gradient(180deg, var(--glow-hi), var(--glow))", color: "var(--bg)" } : undefined}
                    >
                      {takipte ? (en ? "✓ following" : "✓ takipte") : (en ? "+ follow" : "+ takip et")}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!sonuclar && (
            <div>
              <p className="mono mb-2 mt-1 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                {en ? `following (${izlenenler.length})` : `takip ettiklerin (${izlenenler.length})`}
              </p>
              {izlenenler.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {en ? "Nobody yet. Search above — when they play on any radio, you'll know." : "Henüz kimse yok. Yukarıdan ara — herhangi bir radyoda çaldığı an haberin olsun."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {izlenenler.map((ad) => (
                    <button key={ad} onClick={() => takipDegistir(ad)} className="menu-kalem press !py-2 text-sm" title={en ? "unfollow" : "takibi bırak"}>
                      {ad} <span style={{ color: "var(--muted)" }}>×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bildirim durumu — takip ancak bildirimle anlam kazanır */}
        <div className="mt-4 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--line-hi)" }}>
          {radar ? (
            <span>🔔 {en ? "Notifications are on — even when the site is closed." : "Bildirimler açık — site kapalıyken bile haber gelir."}</span>
          ) : iosKurulmamis ? (
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span style={{ color: "var(--muted)" }}>{en ? "On iPhone, install ŞİMDİ to the home screen first for notifications." : "iPhone'da bildirim için önce ŞİMDİ'yi ana ekrana kur."}</span>
              <button onClick={() => { kapat(); kurAc(); }} className="hap-marka press !py-1.5 text-xs">📲 {en ? "how?" : "nasıl?"}</button>
            </span>
          ) : radarDestekleniyor() ? (
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span style={{ color: "var(--muted)" }}>{en ? "Notifications are off." : "Bildirimler kapalı."}</span>
              <button onClick={radariAc} className="hap-marka press !py-1.5 text-xs">🔔 {en ? "turn on" : "bildirimleri aç"}</button>
            </span>
          ) : (
            <span style={{ color: "var(--muted)" }}>{en ? "This browser can't receive notifications; you'll still see a banner while the site is open." : "Bu tarayıcı bildirim alamıyor; site açıkken yine de ana sayfada bant düşer."}</span>
          )}
          {radarMesaj && <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{radarMesaj}</p>}
        </div>
      </div>
    </div>
  );
}
