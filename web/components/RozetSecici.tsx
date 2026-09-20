"use client";

import { useState } from "react";
import { embedKodu } from "@/lib/embed";

function readableOn(hex: string): string {
  const h = (hex || "#6b7280").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

type Ist = { slug: string; name: string; accent: string };

// Self-servis rozet seçici: istasyonunu bul, canlı önizle, kodu kopyala.
export default function RozetSecici({ list }: { list: Ist[] }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(list[0]?.slug ?? "");
  const [kop, setKop] = useState(false);

  const secili = list.find((s) => s.slug === sel) ?? list[0];
  const ql = q.trim().toLocaleLowerCase("tr");
  const suz = ql ? list.filter((s) => s.name.toLocaleLowerCase("tr").includes(ql)) : list;
  const kod = secili ? embedKodu(secili.slug, secili.name) : "";

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(kod);
      setKop(true);
      setTimeout(() => setKop(false), 1600);
    } catch {
      // yoksay
    }
  }

  if (!secili) return null;

  return (
    <div className="mt-8">
      {/* Arama */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="istasyon ara…"
        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
        style={{ borderColor: "var(--line)", color: "var(--fg)" }}
      />

      {/* İstasyon çipleri */}
      <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto">
        {suz.slice(0, 80).map((s) => {
          const aktif = s.slug === sel;
          return (
            <button
              key={s.slug}
              onClick={() => setSel(s.slug)}
              className="press rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: aktif ? s.accent : "var(--line)",
                background: aktif ? s.accent : "transparent",
                color: aktif ? readableOn(s.accent) : "var(--fg)",
              }}
            >
              {s.name}
            </button>
          );
        })}
        {suz.length === 0 && (
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            eşleşme yok.
          </span>
        )}
      </div>

      {/* Canlı önizleme */}
      <div className="mt-8">
        <div className="mb-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          önizleme
        </div>
        <iframe
          key={secili.slug}
          src={`/embed/${secili.slug}`}
          width={360}
          height={92}
          style={{ border: 0, borderRadius: 16, maxWidth: "100%" }}
          title={`${secili.name} — şu an ne çalıyor`}
          loading="lazy"
        />
      </div>

      {/* Kod + kopyala */}
      <div className="mt-6">
        <div className="mb-2 text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          {secili.name} için kod
        </div>
        <pre
          className="overflow-x-auto rounded-md border p-3 text-xs"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          <code>{kod}</code>
        </pre>
        <button
          onClick={kopyala}
          className="press mt-2 rounded-md px-5 py-2 text-sm font-semibold"
          style={{ background: secili.accent, color: readableOn(secili.accent) }}
        >
          {kop ? "kopyalandı ✓" : "kodu kopyala"}
        </button>
      </div>
    </div>
  );
}
