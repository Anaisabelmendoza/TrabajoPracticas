import type { NextConfig } from "next";

const nextConfig: NextConfig = {  
  experimental: {
    forceSwcTransforms: true, // Fuerza a Next.js a usar SWC en lugar de Babel
  },
};

export default nextConfig;
