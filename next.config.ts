import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/compare",
        destination: "/",
        permanent: true, // 308 redirect (SEO-friendly)
      },
    ];
  },
};

export default nextConfig;
