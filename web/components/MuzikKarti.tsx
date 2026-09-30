"use client";

import { useEffect, useState } from "react";

/* MÜZİK KARTI — çalan parçanın kimliği: kapak + albüm, sanatçının kısa
   hikâyesi (Wikipedia), yaklaşan konserleri. Çalma çubuğundaki parça adına
   ya da mini kapağa dokununca açılır. Veri: /api/muzik-karti (günlük önbellek). */

type Kart = {
  artist: string;
  title: string | null;
  kapak: string | null;
  album: string | null;
  yil: string | null;
  bio: string | null;
  wikiUrl: string | null;
  resim: string | null;
  konserler: { tarih: string; mekan: string; sehir: string; url: string | null }[];
  bandsintownUrl: string;
};

function tarihYaz(iso: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/* Çalma çubuğu için mini kapak — bulunursa 40×40 görünür, yoksa hiç yer kaplamaz. */
export function KapakMini({ artist, title, onClick }: { artist: string; title: string | null; onClick: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let iptal = false;
    setSrc(null);
    fetch(`/api/muzik-karti?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title ?? "")}`)
      .then((r) => r.json())
      .then((d) => {
        if (!iptal && d?.kapak) setSrc(String(d.kapak).replace("600x600", "120x120"));
      })
      .catch(() => {});
    return () => {
      iptal = true;
    };
  }, [artist, title]);
  if (!src) return null;
  return (
    <button onClick={onClick} className="press shrink-0" aria-label="parça hakkında" title="parça hakkında">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-12 w-12 rounded-xl object-cover" style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.4)" }} />
    </button>
  );
}

export default function MuzikKarti({
  artist,
  title,
  accent,
  onClose,
}: {
  artist: string;
  title: string | null;
  accent: string;
  onClose: () => void;
}) {
  const [kart, setKart] = useState<Kart | null>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "hata">("yukleniyor");

  useEffect(() => {
    fetch(`/api/muzik-karti?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title ?? "")}`)
      .then((r) => r.json())
      .then((d) => {
        setKart(d);
        setDurum(d?.error ? "hata" : "hazir");
      })
      .catch(() => setDurum("hata"));
  }, [artist, title]);

  const arama = encodeURIComponent([artist, title].filter(Boolean).join(" "));

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label={`${artist} hakkında`}>
      <button aria-label="kapat" onClick={onClose} className="absolute inset-0 h-full w-full" style={{ background: "rgba(0,0,0,0.65)" }} />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] max-w-md overflow-y-auto rounded-t-2xl border-t px-5 pb-10 pt-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
        style={{ background: "var(--bg)", borderColor: "var(--line)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="mono text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
            ♪ müzik kartı
          </span>
          <button onClick={onClose} className="press rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            kapat
          </button>
        </div>

        {durum === "yukleniyor" && (
          <div className="flex items-center gap-4">
            <div className="skeleton h-28 w-28 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="skeleton mb-2 h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          </div>
        )}

        {durum === "hata" && (
          <p className="read text-sm" style={{ color: "var(--muted)" }}>
            kart şu an açılamadı — frekans parazitli, birazdan yeniden dene.
          </p>
        )}

        {durum === "hazir" && kart && (
          <>
            {/* Kapak + parça */}
            <div className="flex items-start gap-4">
              {(kart.kapak || kart.resim) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={kart.kapak ?? kart.resim!}
                  alt={kart.album ?? kart.artist}
                  className="h-28 w-28 shrink-0 rounded-xl object-cover"
                  style={{ boxShadow: `0 12px 32px -12px ${accent}` }}
                />
              )}
              <div className="min-w-0 flex-1">
                {kart.title && <p className="text-lg font-bold leading-snug">{kart.title}</p>}
                <p className="text-[15px] font-semibold" style={{ color: accent }}>{kart.artist}</p>
                {kart.album && (
                  <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    💿 {kart.album}
                    {kart.yil ? ` · ${kart.yil}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Kısa hikâye */}
            {kart.bio && (
              <p className="read mt-5 text-sm leading-relaxed" style={{ color: "var(--fg)" }}>
                {kart.bio}
                {kart.wikiUrl && (
                  <>
                    {" "}
                    <a href={kart.wikiUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--muted)" }}>
                      Wikipedia →
                    </a>
                  </>
                )}
              </p>
            )}

            {/* Konserler */}
            <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--line)" }}>
              <p className="mono mb-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                🎤 yaklaşan konserler
              </p>
              {kart.konserler.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {kart.konserler.map((k, i) => (
                    <li key={i} className="text-sm">
                      <a
                        href={k.url ?? kart.bandsintownUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-baseline gap-2 underline-offset-2 hover:underline"
                      >
                        <span className="mono shrink-0 text-xs tabular-nums" style={{ color: accent }}>
                          {tarihYaz(k.tarih)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {k.mekan}
                          <span style={{ color: "var(--muted)" }}> · {k.sehir}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  kayıtlı konser bulunamadı —{" "}
                  <a href={kart.bandsintownUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Bandsintown&apos;da takip et →
                  </a>
                </p>
              )}
            </div>

            {/* Dinleme bağlantıları */}
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`https://open.spotify.com/search/${arama}`} target="_blank" rel="noopener noreferrer" className="press hap text-xs">
                Spotify&apos;da aç
              </a>
              <a href={`https://www.youtube.com/results?search_query=${arama}`} target="_blank" rel="noopener noreferrer" className="press hap text-xs">
                YouTube&apos;da aç
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
