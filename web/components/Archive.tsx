"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import DilToggle from "./DilToggle";
import { useDil } from "@/lib/i18n";

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

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

type AraRow = { artist: string | null; title: string | null; startedAt: string; slug: string | null; name: string; accentColor: string | null };

export default function Archive() {
  const { t } = useDil();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "empty" | "error">("loading");
  // Arşiv araması
  const [q, setQ] = useState("");
  const [araRows, setAraRows] = useState<AraRow[] | null>(null);
  const [araStatus, setAraStatus] = useState<"idle" | "loading" | "empty">("idle");

  async function araYap(term: string) {
    const t = term.trim();
    if (t.length < 2) {
      setAraRows(null);
      setAraStatus("idle");
      return;
    }
    setAraStatus("loading");
    try {
      const res = await fetch(`/api/ara?q=${encodeURIComponent(t)}`, { cache: "no-store" });
      const data = await res.json();
      const list: AraRow[] = data.rows ?? [];
      setAraRows(list);
      setAraStatus(list.length ? "idle" : "empty");
    } catch {
      setAraRows([]);
      setAraStatus("empty");
    }
  }

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

  // Geçmişte bir güne atla (gün cinsinden geriye). 0 = şimdi.
  function gecmiseGit(gunGeri: number) {
    const d = new Date();
    if (gunGeri > 0) d.setDate(d.getDate() - gunGeri);
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const ts = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDate(ds);
    setTime(ts);
    fetchArchive(ds, ts);
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
              <h1 className="brand text-4xl font-bold tracking-tight">
                ŞİMDİ <span style={{ color: "var(--muted)" }}>· arşiv</span>
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {t("arsiv.alt")}
              </p>
            </div>
            <span className="flex items-center gap-3">
              <DilToggle />
              <ThemeToggle />
              <Link href="/" className="text-sm underline" style={{ color: "var(--muted)" }}>
                {t("nav.simdi")}
              </Link>
            </span>
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
              {t("arsiv.goster")}
            </button>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            Saat Türkiye saatidir. Arşiv, toplayıcı çalışmaya başladığı andan itibaren doludur.
          </p>

          {/* Geçmişte bugün — hızlı sıçrama */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              {t("arsiv.gecmiste")}:
            </span>
            {(
              [
                [1, t("arsiv.dun")],
                [7, t("arsiv.haftaOnce")],
                [30, t("arsiv.ayOnce")],
                [365, t("arsiv.yilOnce")],
              ] as const
            ).map(([g, label]) => (
              <button
                key={g}
                onClick={() => gecmiseGit(g)}
                className="press rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: "var(--line)", color: "var(--fg)" }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => gecmiseGit(0)}
              className="press rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: "var(--line)", color: "var(--muted)" }}
            >
              {t("arsiv.simdiye")}
            </button>
          </div>

          {/* Arşivde ara */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              araYap(q);
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (!e.target.value.trim()) {
                  setAraRows(null);
                  setAraStatus("idle");
                }
              }}
              placeholder={t("arsiv.ara")}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              style={{ background: "transparent", borderColor: "var(--line)", color: "var(--fg)" }}
            />
            <button
              type="submit"
              className="rounded-md border px-4 py-2 text-sm"
              style={{ borderColor: "var(--line)", color: "var(--fg)" }}
            >
              {t("arsiv.araBtn")}
            </button>
          </form>
        </header>

        {/* Arama sonuçları */}
        {araRows !== null && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                &quot;{q}&quot; için arşiv
              </h2>
              <button
                onClick={() => {
                  setQ("");
                  setAraRows(null);
                  setAraStatus("idle");
                }}
                className="text-xs underline"
                style={{ color: "var(--muted)" }}
              >
                {t("arsiv.temizle")}
              </button>
            </div>
            {araStatus === "loading" && <p style={{ color: "var(--muted)" }}>aranıyor…</p>}
            {araStatus === "empty" && (
              <p style={{ color: "var(--muted)" }}>Arşivde bu aramaya kayıt yok (henüz).</p>
            )}
            {araStatus === "idle" && araRows.length > 0 && (
              <ul className="flex flex-col">
                {araRows.map((r, i) => {
                  const c = r.accentColor || DEFAULT_ACCENT;
                  const t = new Date(r.startedAt);
                  const when = `${pad(t.getDate())}.${pad(t.getMonth() + 1)} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
                  const inner = (
                    <div className="flex items-center gap-3 border-b py-3" style={{ borderColor: "var(--line)" }}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">
                          <span className="font-semibold">{r.artist?.trim() || r.title}</span>
                          {r.artist && r.title && r.artist !== r.title && (
                            <span style={{ color: "var(--muted)" }}> — {r.title}</span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--muted)" }}>
                          <span style={{ color: c }}>{r.name}</span> · {when}
                        </span>
                      </span>
                    </div>
                  );
                  return (
                    <li key={i}>
                      {r.slug ? (
                        <Link href={`/radyo/${r.slug}`} className="press block">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 50%, #000))`,
                        color: readableOn(c),
                      }}
                    >
                      {r.name.trim().charAt(0).toLocaleUpperCase("tr")}
                    </span>
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
