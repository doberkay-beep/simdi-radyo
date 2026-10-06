import Link from "next/link";
import { haftaEtiketi, haftalar, buHafta, type Rapor } from "@/lib/rapor";
import { sarkiSlug } from "@/lib/seoslug";

// Haftalık rapor gövdesi — /rapor ve /rapor/[hafta] ortak.
function Degisim({ sira, onceki, karsilastir }: { sira: number; onceki: number | null | undefined; karsilastir: boolean }) {
  if (!karsilastir) return <span className="mono w-9 shrink-0 text-right text-[10px]" style={{ color: "var(--faint)" }}>·</span>;
  if (onceki == null) return <span className="mono w-9 shrink-0 text-right text-[10px] font-bold" style={{ color: "#3ddc84" }}>YENİ</span>;
  const d = onceki - sira;
  return (
    <span className="mono w-9 shrink-0 text-right text-[11px]" style={{ color: d > 0 ? "#3ddc84" : d < 0 ? "#e5382c" : "var(--muted)" }}>
      {d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : "="}
    </span>
  );
}

export default function RaporGovde({ hafta, r }: { hafta: string; r: Rapor | null }) {
  const devam = hafta === buHafta();
  const liste = haftalar();
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
        <Link href="/" className="nav-link">ŞİMDİ</Link> · haftalık rapor
      </p>
      <h1 className="brand mt-2 text-4xl font-bold leading-tight">TÜRKİYE RADYO RAPORU</h1>
      <p className="mono mt-2 text-[12px] uppercase tracking-[0.18em]" style={{ color: "var(--glow-hi)" }}>
        {haftaEtiketi(hafta)}{devam ? " · hafta sürüyor" : ""}
      </p>

      {!r ? (
        <p className="epigraf mt-8 text-base">Bu haftanın raporu hazırlanıyor. Günlük sayımlar tamamlandıkça burada belirecek.</p>
      ) : (
        <>
          <p className="epigraf mt-4 text-base">
            Türkiye radyolarında {r.gun_sayisi} günde, en az iki istasyonda çalan şarkılar. Her parça değişimi
            7/24 kaydedildi; liste bu kayıtların sayımıdır.
          </p>

          {r.ilk20[0] && (
            <section className="mt-8 rounded-2xl border p-5" style={{ borderColor: "var(--line-hi)", background: "color-mix(in srgb, var(--glow) 6%, var(--panel))" }}>
              <p className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>haftanın şarkısı</p>
              <p className="dial mt-1 text-3xl uppercase leading-tight">{r.ilk20[0].title}</p>
              <p className="mt-1 text-lg">{r.ilk20[0].artist}</p>
              <p className="mono mt-2 text-[12px]" style={{ color: "var(--glow-hi)" }}>{r.ilk20[0].kez} kez · {r.ilk20[0].istasyon} radyo</p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mono mb-3 text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>ilk 20</h2>
            <ol className="flex flex-col">
              {r.ilk20.map((s, i) => (
                <li key={`${s.artist}-${s.title}`} className="flex items-center gap-3 border-b py-2.5" style={{ borderColor: "var(--line)" }}>
                  <span className="dial w-7 shrink-0 text-right text-xl" style={{ color: i < 3 ? "var(--glow-hi)" : "var(--muted)" }}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{s.title}</span>
                    <Link prefetch={false} href={`/sanatci/${sarkiSlug(s.artist)}`} className="block truncate text-[13px] hover:underline" style={{ color: "var(--muted)" }}>{s.artist}</Link>
                  </span>
                  <span className="mono shrink-0 text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>{s.kez}</span>
                  <Degisim sira={i + 1} onceki={s.onceki_sira} karsilastir={r.onceki_var} />
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {r.sanatcilar.length > 0 && (
              <section className="rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
                <h2 className="mono mb-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>haftanın sanatçıları</h2>
                <ol className="flex flex-col gap-1.5 text-[14px]">
                  {r.sanatcilar.map((s, i) => (
                    <li key={s.ad} className="flex items-baseline gap-2">
                      <span className="mono w-4 text-[11px]" style={{ color: i === 0 ? "var(--glow-hi)" : "var(--muted)" }}>{i + 1}</span>
                      <Link prefetch={false} href={`/sanatci/${sarkiSlug(s.ad)}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">{s.ad}</Link>
                      <span className="mono text-[11px]" style={{ color: "var(--muted)" }}>{s.kez}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {(r.yukselen.length > 0 || r.yeni.length > 0) && (
              <section className="rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
                {r.yukselen.length > 0 && (
                  <>
                    <h2 className="mono mb-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: "#3ddc84" }}>▲ en çok yükselenler</h2>
                    {r.yukselen.map((s) => (
                      <p key={`${s.artist}-${s.title}`} className="truncate text-[13px]"><strong>{s.artist}</strong> — {s.title} <span style={{ color: "var(--muted)" }}>{s.onceki}→{s.kez}</span></p>
                    ))}
                  </>
                )}
                {r.yeni.length > 0 && (
                  <>
                    <h2 className="mono mb-2 mt-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--glow-hi)" }}>listeye yeni girenler</h2>
                    {r.yeni.map((s) => (
                      <p key={`${s.artist}-${s.title}`} className="truncate text-[13px]"><strong>{s.artist}</strong> — {s.title} <span style={{ color: "var(--muted)" }}>{s.kez} kez</span></p>
                    ))}
                  </>
                )}
              </section>
            )}
          </div>

          <p className="mt-8 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Yöntem: ŞİMDİ, Türkiye'deki radyoların canlı yayınındaki parça bilgisini 7/24 kaydeder. Liste, hafta
            içinde (Pazartesi–Pazar, İstanbul saati) en az iki farklı istasyonda çalan parçaların çalınma sayısıdır;
            reklam, jingle ve istasyon adı içeren kayıtlar ayıklanır. Alıntılarken “ŞİMDİ verisine göre” kaynağını belirtin.
          </p>
        </>
      )}

      {liste.length > 1 && (
        <nav className="mt-10" aria-label="geçmiş haftalar">
          <p className="mono mb-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>diğer haftalar</p>
          <div className="flex flex-wrap gap-2">
            {liste.map((h) => (
              <Link key={h} prefetch={false} href={h === buHafta() ? "/rapor" : `/rapor/${h}`} className="chip" data-on={h === hafta ? "1" : "0"}>
                {haftaEtiketi(h)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </main>
  );
}
