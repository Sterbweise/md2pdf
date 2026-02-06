import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side features for Puppeteer
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
