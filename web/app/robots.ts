import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://necaliyor.co/sitemap.xml",
    host: "https://necaliyor.co",
  };
}
