process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = "1";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@eagle-pathway/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bkkhheaeqhhfeyfwjjxx.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

