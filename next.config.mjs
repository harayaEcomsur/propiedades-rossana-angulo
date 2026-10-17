import { DEVICE_SIZES, IMAGE_SIZES } from "./lib/image-sizes.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // La optimización de imágenes es nuestra, no del optimizador de Vercel:
    // ver lib/image-loader.ts (locales pre-generadas + /api/img con sharp).
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: DEVICE_SIZES,
    imageSizes: IMAGE_SIZES,
  },
  // Variantes locales (/img/<archivo> → public/_opt/<archivo>.avif|.webp):
  // AVIF a quien lo acepta, WebP al resto. Es una regla estática, sin
  // función. El nombre lleva el hash del original: nunca cambian.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/img/:file", has: [{ type: "header", key: "accept", value: ".*image/avif.*" }], destination: "/_opt/:file.avif" },
        { source: "/img/:file", destination: "/_opt/:file.webp" },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/img/:file",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Vary", value: "Accept" },
        ],
      },
    ];
  },
};

export default nextConfig;
