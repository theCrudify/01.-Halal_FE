import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nonaktifkan floating Next.js dev indicator / icon melayang di development mode
  devIndicators: false,
  // Every page is per-user (session cookie), so plain dynamic rendering is used instead of cacheComponents.
  experimental: { serverActions: { bodySizeLimit: "20mb" } }, // up to 3 attachments of 5 MB
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
