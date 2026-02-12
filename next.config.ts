import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side features for Puppeteer
  serverExternalPackages: ["puppeteer"],
  
  // Enable standalone output for Docker deployment
  output: "standalone",
};

export default nextConfig;
