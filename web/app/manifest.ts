import type { MetadataRoute } from "next";

// Telefonda "ana ekrana ekle" için: düzgün isim, ikon, tam ekran, koyu tema.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ŞİMDİ — radyoda şu an ne çalıyor",
    short_name: "ŞİMDİ",
    description: "Türkiye'deki radyolarda şu an çalan parçalar, canlı.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    lang: "tr",
    dir: "ltr",
    orientation: "portrait",
    categories: ["music", "entertainment"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Keşif", short_name: "Keşif", url: "/kesif", description: "Ruh haline göre radyo keşfet" },
      { name: "Radyo Nabzı", short_name: "Nabız", url: "/nabiz", description: "Şu an en çok ne çalıyor" },
      { name: "Arşiv", short_name: "Arşiv", url: "/arsiv", description: "Çalınanların kalıcı arşivi" },
    ],
  };
}
