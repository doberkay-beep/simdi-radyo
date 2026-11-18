import type { MetadataRoute } from "next";

// Ana ekrana ekle / masaüstüne kur (Windows, Android, iOS) için manifest.
// 18 Kas 2026 (Windows hazırlığı):
// - id "/": kurulu uygulamanın kalıcı kimliği. Eskiden açık yazılmıyordu ve start_url'den ("/")
//   türüyordu; aynı değer, kurulu olanlar etkilenmez. Bundan sonra DEĞİŞTİRİLMEZ.
// - orientation "any": masaüstü penceresinde dikey kilit anlamsız.
// - lang: site arayüzü tr + en; birincil dil tr. (30 dil iOS uygulamasında, web'de değil.)
// - Windows karoları için 44/150/310 kare + 310x150 geniş ikon; Edge/Chrome'un zengin kurulum
//   penceresi için dar + geniş ekran görüntüsü.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "nowby. — radyoda şu an ne çalıyor",
    short_name: "nowby.",
    description: "Türkiye'nin ve dünyanın radyolarında şu an çalan şarkılar, canlı ve tek ekranda.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "tr",
    dir: "ltr",
    orientation: "any",
    categories: ["music", "entertainment"],
    launch_handler: { client_mode: "focus-existing" },
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/pwa/ikon-310.png", sizes: "310x310", type: "image/png", purpose: "any" },
      { src: "/pwa/ikon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/pwa/ikon-150.png", sizes: "150x150", type: "image/png", purpose: "any" },
      { src: "/pwa/ikon-44.png", sizes: "44x44", type: "image/png", purpose: "any" },
      { src: "/pwa/genis-310x150.png", sizes: "310x150", type: "image/png", purpose: "any" },
      { src: "/pwa/genis-620x300.png", sizes: "620x300", type: "image/png", purpose: "any" },
    ],
    screenshots: [
      { src: "/pwa/ekran-genis-tr.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "nowby. — radyoda şu an çalan şarkı" },
      { src: "/pwa/ekran-dar-tr.png", sizes: "540x1170", type: "image/png", form_factor: "narrow", label: "nowby. — telefonda" },
    ],
    shortcuts: [
      { name: "Keşif", short_name: "Keşif", url: "/kesif", description: "Ruh haline göre radyo keşfet", icons: [{ src: "/pwa/ikon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Radyo Nabzı", short_name: "Nabız", url: "/nabiz", description: "Şu an en çok ne çalıyor", icons: [{ src: "/pwa/ikon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Arşiv", short_name: "Arşiv", url: "/arsiv", description: "Çalınanların kalıcı arşivi", icons: [{ src: "/pwa/ikon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
