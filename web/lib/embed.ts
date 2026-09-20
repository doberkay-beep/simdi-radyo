// Gömme kodu üreticisi — hem istasyon sayfasındaki "siteme ekle" hem de
// /rozet self-servis sayfası aynı kodu kullansın. iframe + DIŞINDA gerçek,
// crawlanabilir künye linki (backlink değeri buradan gelir).
export function embedKodu(slug: string, name: string): string {
  const ad = name.replace(/"/g, "'");
  return `<div style="max-width:360px">
  <iframe src="https://necaliyor.co/embed/${slug}" width="360" height="92" style="border:0;border-radius:16px;max-width:100%" title="${ad} — şu an ne çalıyor" loading="lazy"></iframe>
  <p style="font:12px/1.4 system-ui,sans-serif;margin:6px 2px 0;color:#888">
    <a href="https://necaliyor.co/radyo/${slug}" style="color:inherit">${ad} şu an ne çalıyor</a> · <a href="https://necaliyor.co" style="color:inherit">necaliyor.co</a>
  </p>
</div>`;
}
