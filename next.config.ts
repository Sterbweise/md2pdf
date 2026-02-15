import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side features for Puppeteer
  serverExternalPackages: ["puppeteer"],

  // Enable standalone output for Docker deployment
  output: "standalone",

  // SEO-friendly headers & security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security headers (improve trust signals for search engines)
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Performance - help search engine crawlers
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      // Cache static assets aggressively (improves Core Web Vitals / page speed)
      {
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects for common misspellings / alternate paths
  async redirects() {
    return [
      {
        source: "/index",
        destination: "/",
        permanent: true,
      },
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
