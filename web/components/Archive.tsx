"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  slug: string;
  name: string;
  accentColor: string | null;
  artist: string | null;
  title: string | null;
  rawTitle: string | null;
  startedAt: string;
};

const DEFAULT_ACCENT = "#6b7280";
const pad = (n: number) => String(n).padStart(2, "0");

export default function Archive() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "empty" | "error">("loading");

  async function fetchArchive(d: string, t: string) {
    if (!d) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/archive?date=${d}&time=${t}`, { cache: "no-store" });
      const data = await res.json();
      if (data.error) {
        setStatus("error");
        return;
      }
      const list: Row[] = data.stations ?? [];
      setRows(list);
      setStatus(list.length ? "idle" : "empty");
    } catch {
      setStatus("error");
    }
  }

  // İlk açılışta "şu an"ı göster.
  useEffect(() => {
    const now = new Date();
    const d = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const t = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setDate(d);
    setTime(t);
    fetchArchive(d, t);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <header className="mb-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                ŞİMDİ <span style={{ color: "var(--muted)" }}>· arşiv</span>
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                o an radyoda ne çalıyordu
              </p>
            </div>
            <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
              ← şimdi
            </Link>
          </div>

          {/* Tarih + saat seçici */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
              style={{ background: "transparent", borderColor: "var(--line)", color: "var(--fg)" }}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
              style={{ background: "transparent", borderColor: "var(--line)", color: "var(--fg)" }}
            />
            <button
              onClick={() => fetchArchive(date, time)}
              className="rounded-md px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--fg)", color: "var(--bg)" }}
            >
              Göster
            </button>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            Saat Türkiye saatidir. Arşiv, toplayıcı çalışmaya başladığı andan itibaren doludur.
          </p>
        </header>

        {status === "loading" && <p style={{ color: "var(--muted)" }}>Yükleniyor…</p>}
        {status === "error" && (
          <p style={{ color: "var(--muted)" }}>
            Arşiv okunamadı. (Supabase&apos;de <code>archive.sql</code> çalıştırıldı mı?)
          </p>
        )}
        {status === "empty" && (
          <p style={{ color: "var(--muted)" }}>
            Bu ana ait kayıt yok — arşiv o tarihte henüz veri toplamamış olabilir.
          </p>
        )}

        {status === "idle" && (
          <ul className="flex flex-col">
            {rows.map((r) => {
              const c = r.accentColor || DEFAULT_ACCENT;
              const artist = r.artist?.trim() || null;
              const title = r.title?.trim() || null;
              const same = artist && title && artist === title;
              const t = new Date(r.startedAt);
              const clock = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
              return (
                <li key={r.slug}>
                  <div
                    className="flex items-center gap-4 border-b py-4"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span
                      className="h-8 w-[3px] shrink-0 rounded-full"
                      style={{ background: c }}
                    />
                    <span className="min-w-0 flex-1">
                      {same ? (
                        <span className="block truncate text-[17px] font-semibold">{title}</span>
                      ) : (
                        <span className="block truncate text-[17px]">
                          <span className="font-semibold">{artist ?? title ?? "—"}</span>
                          {artist && title && (
                            <span style={{ color: "var(--muted)" }}> — {title}</span>
                          )}
                        </span>
                      )}
                      <span
                        className="mt-0.5 block truncate text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        <span style={{ color: c }}>{r.name}</span> · {clock}&apos;dan beri
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
