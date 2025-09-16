import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx'],
  webpack: (config: any) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
