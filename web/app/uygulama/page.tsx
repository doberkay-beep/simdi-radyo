import UygulamaKabugu from "@/components/UygulamaKabugu";
import { aktifIstasyonlar } from "@/lib/now";

// İlk boya için izinli radyolar sunucuda; canlı akış istemcide /api/now?uygulama=1 ile sürer.
export const revalidate = 30;

export default async function UygulamaSayfasi() {
  const ilk = await aktifIstasyonlar({ uygulama: true, onbellekli: true }).catch(() => []);
  return <UygulamaKabugu ilkIstasyonlar={ilk} />;
}
