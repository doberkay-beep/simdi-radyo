import { permanentRedirect } from "next/navigation";

// /parca/* eski şarkı sayfaları: her açılışta plays tablosunda ILIKE %…% taraması yapıyordu.
// Botlar robots.txt'yi yok sayıp bunları dolaşınca disk bütçesi tükeniyordu (7 ve 21 Eki 2026).
// Artık veritabanına hiç gitmeden arşiv aramasına yönlenir; arama yalnız tarayıcıda, insan açınca çalışır.
export default async function Sayfa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/arsiv?q=${encodeURIComponent(slug.replace(/-/g, " ").slice(0, 60))}`);
}
