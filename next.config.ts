import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // This disables ESLint checks during `npm run build`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
