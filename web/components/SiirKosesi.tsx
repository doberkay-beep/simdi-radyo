"use client";

// 📖 ŞİİR KÖŞESİ — Şiir Rafım Radyosu: Türk şiirinden sesli okumalar (YouTube çalma listesi).
// Canlı ses akışı değil; YouTube kuralları gereği oynatıcı görünür kalır, sayaca girmez.
// Kaynak: siirrafim.art (Sadık Doğan). Radyo açıksa köşe açılınca yayın durur (iki ses üst üste binmesin).
const LISTE = "PLbW6sTxKenw8Ok_ErKcKTP-leBAbBTAIS";
const SAYFA = "https://www.siirrafim.art/p/siir-rafim-radyosu.html";

export default function SiirKosesi({ acik, kapat, dil }: { acik: boolean; kapat: () => void; dil: string }) {
  const en = dil === "en";
  if (!acik) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-label={en ? "poetry corner" : "şiir köşesi"}>
      <button className="absolute inset-0" style={{ background: "color-mix(in srgb, #000 62%, transparent)" }} onClick={kapat} aria-label={en ? "close" : "kapat"} />
      <div className="menu-sayfa absolute inset-x-0 bottom-0 rounded-t-2xl p-5 pb-8 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
        <div className="mb-3 flex items-center justify-between">
          <span className="mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            📖 {en ? "POETRY CORNER" : "ŞİİR KÖŞESİ"}
          </span>
          <button onClick={kapat} className="press text-xl leading-none" aria-label={en ? "close" : "kapat"}>×</button>
        </div>

        <h2 className="brand text-2xl font-bold">Şiir Rafım Radyosu</h2>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {en
            ? "Spoken poetry from Turkish literature: Nazım Hikmet, Can Yücel, Ahmed Arif, Ataol Behramoğlu and more than 200 readings."
            : "Türk şiirinden sesli okumalar: Nazım Hikmet, Can Yücel, Ahmed Arif, Ataol Behramoğlu ve 200'den fazla şiir."}
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--line)", aspectRatio: "16 / 9" }}>
          <iframe
            title="Şiir Rafım Radyosu"
            src={`https://www.youtube-nocookie.com/embed/videoseries?list=${LISTE}&rel=0`}
            width="100%"
            height="100%"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ display: "block", border: 0 }}
          />
        </div>

        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          {en ? "Curated by " : "Hazırlayan: "}
          <a href={SAYFA} target="_blank" rel="noopener" className="underline">Şiir Rafım · siirrafim.art</a>
          {en ? ". Poetry and radio are born in the same place: in listening." : ". Şiir de radyo da aynı yerden doğar: dinlemekten."}
        </p>
      </div>
    </div>
  );
}
