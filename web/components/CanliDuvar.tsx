"use client";

import { memo, useEffect, useMemo, useState } from "react";

// Açılış duvarı: radyoda gerçekten çalan şarkılar dev yazıyla, sırayla belirir.
// Hiçbir satır uydurma değil; hepsi o an yayında olanın kendisi.

type Calan = { artist: string | null; title: string | null } | null;
type Ist = { slug: string; name: string; band: "tr" | "int" | "own"; nowPlaying: Calan };

const SURE = 7000;
// Yayın dolgusu ve bozuk bilgi dev yazıyla görünmesin.
const COP = /jingle|now playing|goes here|reklam|radyo|radio|\bfm\b|www\.|https?:|anons|haber/i;

export const CanliDuvar = memo(function CanliDuvar({
  stations,
  playing,
  onTune,
  soru,
  en,
}: {
  stations: Ist[];
  playing: string | null;
  onTune: (slug: string) => void;
  soru: string;
  en: boolean;
}) {
  const adaylar = useMemo(
    () =>
      stations.filter((s) => {
        const a = s.nowPlaying?.artist?.trim();
        const t = s.nowPlaying?.title?.trim();
        return s.band === "tr" && a && t && a !== t && a.length + t.length < 64 && !COP.test(`${a} ${t}`);
      }),
    [stations],
  );
  const [sira, setSira] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!document.hidden) setSira((n) => n + 1);
    }, SURE);
    return () => clearInterval(id);
  }, []);

  const calan = playing ? stations.find((s) => s.slug === playing && s.nowPlaying?.title) : null;
  const s = calan ?? (adaylar.length ? adaylar[sira % adaylar.length] : null);
  const artist = s?.nowPlaying?.artist?.trim() || "";
  const title = s?.nowPlaying?.title?.trim() || "";
  const uzun = artist.length + title.length > 30;

  return (
    <section className="canli-duvar">
      <h1 className="canli-soru">{soru}</h1>
      {s ? (
        <div key={s.slug + title} className="canli-sarki">
          <p className={uzun ? "canli-ad uzun" : "canli-ad"}>
            <span>{artist && artist !== title ? artist : title}</span>
            {artist && artist !== title ? <em>{title}</em> : null}
          </p>
          <p className="canli-alt">
            <span>
              {calan ? (en ? "You're listening to " : "Şu an dinliyorsun: ") : en ? "On air now: " : "Şu an: "}
              {s.name}
            </span>
            <button type="button" onClick={() => onTune(s.slug)}>
              {calan ? (en ? "Stop" : "Durdur") : en ? "Listen" : "Dinle"}
            </button>
          </p>
        </div>
      ) : null}
    </section>
  );
});
