import type { NextConfig } from "next";

// ŞİMDİ web: static export YOK — okuma API'si ve ses proxy'si için sunucu gerekiyor.
// turbopack.root: bu klasörü kök say (üstteki kişisel site lockfile'ıyla karışmasın).
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Eski ad: necaliyor.co (ŞİMDİ) → nowby.co. Her yol karşılığına kalıcı yönlenir (308).
  async redirects() {
    return ["necaliyor.co", "www.necaliyor.co"].map((host) => ({
      source: "/:yol*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://nowby.co/:yol*",
      permanent: true,
    }));
  },
};

export default nextConfig;
