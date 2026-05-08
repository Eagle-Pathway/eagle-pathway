import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@eagle-pathway/shared"],
  // For Next.js monorepos, outputFileTracingRoot should be at the top level
  outputFileTracingRoot: path.resolve(__dirname, ".."),
};

export default nextConfig;
