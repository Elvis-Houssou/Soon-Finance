import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: { globalNotFound: true }, // vrai 404 pour les fiches Apprendre inconnues (voir proxy.ts)
  partialPrefetching: true,
  // Adresse de l'API FastAPI, lue aussi dans le navigateur (ex. http://localhost:8000/api).
  env: { NEXT_BASE_API_URL: process.env.NEXT_BASE_API_URL ?? "" },
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
