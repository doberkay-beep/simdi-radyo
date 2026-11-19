import { geceYarisiKarti, KART_BOYUT } from "@/lib/gece-yarisi-kart";

// Paylaşım görseli (WhatsApp/X/iMessage önizlemesi).
export const alt = "Gece yarısı ne çalıyordu? — nowby. yılbaşı gecesi";
export const size = KART_BOYUT;
export const contentType = "image/png";
export const revalidate = 86400; // yıl değişince kart da değişsin

export default function Image() {
  return geceYarisiKarti("tr");
}
