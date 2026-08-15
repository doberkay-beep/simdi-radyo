// Geçici karşılama sayfası. Gerçek arayüz Faz 3'te gelecek.
export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 40, lineHeight: 1.6 }}>
      <h1>ŞİMDİ</h1>
      <p>Radyolarda şu an ne çalıyor. Arayüz Faz 3&apos;te gelecek. Okuma API uçları:</p>
      <ul>
        <li>
          <code>/api/now</code> — tüm aktif istasyonlar + şu an çalan
        </li>
        <li>
          <code>/api/stream/[slug]</code> — ses akışı proxy&apos;si
        </li>
        <li>
          <code>/api/archive?date=YYYY-MM-DD&amp;time=HH:MM</code> — o ana en yakın kayıtlar
        </li>
      </ul>
    </main>
  );
}
