import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@eagle-pathway/shared"],
};

export default nextConfig;