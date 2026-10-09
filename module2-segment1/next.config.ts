import type { NextConfig } from "next";

// PROTOTYPE=1 builds a static copy (out/) for hosting as a Claude page: see scripts/build-prototype.mjs.
const prototype = process.env.PROTOTYPE === "1";

const nextConfig: NextConfig = {
  ...(prototype ? { output: "export" as const, distDir: ".next-prototype", assetPrefix: process.env.PROTOTYPE_PREFIX ?? "./app" } : {}),
  // Partial prerendering cannot be used in a static export.
  cacheComponents: !prototype,
  devIndicators: false,
  partialPrefetching: !prototype,
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
