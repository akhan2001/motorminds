import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx'],
  webpack: (config: any) => {
    config.resolve.alias.canvas = false;
    
    // Suppress webpack cache serialization warning
    config.infrastructureLogging = {
      level: 'error',
    };
    
    return config;
  },
};

export default nextConfig;
