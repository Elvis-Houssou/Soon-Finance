import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: { globalNotFound: true }, // vrai 404 pour les fiches Apprendre inconnues (voir proxy.ts)
  partialPrefetching: true,
  // Base des appels à l'API, lue aussi dans le navigateur (ex. http://localhost:3000/api) ; vide = « /api ».
  env: { NEXT_BASE_API_URL: process.env.NEXT_BASE_API_URL ?? "" },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_ORIGIN || "http://127.0.0.1:8000"}/api/:path*` }];
  },
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
