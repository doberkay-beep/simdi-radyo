import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // /parca/* eski şarkı sayfaları: her açılışta arşivi baştan sona tarıyordu (ILIKE %…%);
    // botlar bunları dolaşınca veritabanı yoruluyordu. Arama motoru için /sarki/* sayfaları var.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/parca/"] },
    sitemap: "https://necaliyor.co/sitemap.xml",
    host: "https://necaliyor.co",
  };
}
