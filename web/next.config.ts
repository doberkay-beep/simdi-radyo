import type { NextConfig } from "next";

// ŞİMDİ web: static export YOK — okuma API'si ve ses proxy'si için sunucu gerekiyor.
// turbopack.root: bu klasörü kök say (üstteki kişisel site lockfile'ıyla karışmasın).
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
