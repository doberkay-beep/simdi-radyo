// Mağaza kabuğunun manifesti (Microsoft Store paketi bunu kullanır).
// id / start_url / scope /uygulama (sonda / yok: Next /uygulama/ adresini /uygulama'ya yönlendiriyor) — sitenin kendi manifestinden (id "/") ayrı bir uygulama.
// id yayına girdikten sonra DEĞİŞTİRİLMEZ.
export const dynamic = "force-static";

const MANIFEST = {
  id: "/uygulama",
  name: "nowby.",
  short_name: "nowby.",
  description: "Radyolarda şu an çalan şarkılar, canlı ve tek ekranda. Her radyo yazılı izin vermiştir.",
  start_url: "/uygulama",
  scope: "/uygulama",
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
    { src: "/pwa/ikon-150.png", sizes: "150x150", type: "image/png", purpose: "any" },
    { src: "/pwa/ikon-44.png", sizes: "44x44", type: "image/png", purpose: "any" },
    { src: "/pwa/genis-310x150.png", sizes: "310x150", type: "image/png", purpose: "any" },
  ],
  screenshots: [
    { src: "/pwa/uygulama-genis.png", sizes: "1366x768", type: "image/png", form_factor: "wide", label: "nowby. — izinli radyolar, canlı" },
    { src: "/pwa/uygulama-dar.png", sizes: "540x1170", type: "image/png", form_factor: "narrow", label: "nowby." },
  ],
};

export function GET() {
  return new Response(JSON.stringify(MANIFEST), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
