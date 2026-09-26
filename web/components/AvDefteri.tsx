"use client";

import { useState } from "react";
import { useDil } from "@/lib/i18n";
import { type Av, avOku, avSil, avTemizle, izlenenOku, izlenenDegistir, izleniyorMu } from "@/lib/avlar";

// Av Defteri — yakaladığın şarkılar: Spotify/YouTube'da aç, sanatçıyı izlemeye al.
// İzlenen sanatçı bir istasyonda çalmaya başlayınca ana sayfada radar bandı düşer.

function nezaman(t: number, en: boolean): string {
  const dk = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (dk < 1) return en ? "just now" : "az önce";
  if (dk < 60) return en ? `${dk}m ago` : `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return en ? `${sa}h ago` : `${sa} sa önce`;
  const g = Math.floor(sa / 24);
  return en ? `${g}d ago` : `${g} gün önce`;
}

export default function AvDefteri({ onClose }: { onClose: () => void }) {
  const { dil, t } = useDil();
  const en = dil === "en";
  const [avlar, setAvlar] = useState<Av[]>(avOku);
  const [izlenenler, setIzlenenler] = useState<string[]>(izlenenOku);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label={t("av.baslik")}>
      <button aria-label="kapat" onClick={onClose} className="absolute inset-0 h-full w-full" style={{ background: "rgba(0,0,0,0.6)" }} />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-2xl border-t px-5 pb-10 pt-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
        style={{ background: "var(--bg)", borderColor: "var(--line)" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">🎣 {t("av.baslik")}</span>
          <button onClick={onClose} className="press rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            {t("frekans.kapat")}
          </button>
        </div>

        {izlenenler.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[11px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              {t("av.izlenenler")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {izlenenler.map((s) => (
                <button
                  key={s}
                  onClick={() => setIzlenenler(izlenenDegistir(s))}
                  title={t("av.izlemeBirak")}
                  className="press rounded-full border px-2.5 py-1 text-xs"
                  style={{ borderColor: "var(--line)", color: "var(--fg)" }}
                >
                  {s} ×
                </button>
              ))}
            </div>
          </div>
        )}

        {avlar.length === 0 ? (
          <p className="read text-sm" style={{ color: "var(--muted)" }}>
            {t("av.bos")}
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {avlar.map((a) => {
                const parca = [a.artist, a.title].filter(Boolean).join(" — ") || "?";
                const arama = encodeURIComponent([a.artist, a.title].filter(Boolean).join(" "));
                const izleniyor = izleniyorMu(izlenenler, a.artist);
                return (
                  <li key={a.t} className="rounded-lg border p-3" style={{ borderColor: "var(--line)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                      {parca}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                      {a.istasyon} · {nezaman(a.t, en)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <a
                        href={`https://open.spotify.com/search/${arama}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: "var(--muted)" }}
                      >
                        Spotify
                      </a>
                      <a
                        href={`https://www.youtube.com/results?search_query=${arama}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: "var(--muted)" }}
                      >
                        YouTube
                      </a>
                      {a.artist && (
                        <button
                          onClick={() => setIzlenenler(izlenenDegistir(a.artist!))}
                          className="press underline"
                          style={{ color: izleniyor ? "var(--fg)" : "var(--muted)" }}
                        >
                          {izleniyor ? `✓ ${t("av.izleniyor")}` : t("av.izle")}
                        </button>
                      )}
                      <button
                        onClick={() => setAvlar(avSil(a.t))}
                        className="press ml-auto"
                        style={{ color: "var(--muted)" }}
                        aria-label={t("av.sil")}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button
              onClick={() => {
                avTemizle();
                setAvlar([]);
              }}
              className="press mt-4 text-xs underline"
              style={{ color: "var(--muted)" }}
            >
              {t("av.temizle")}
            </button>
          </>
        )}
        <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>
          {t("av.gizli")}
        </p>
      </div>
    </div>
  );
}
