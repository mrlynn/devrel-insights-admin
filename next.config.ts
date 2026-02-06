import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence turbopack root warning
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
