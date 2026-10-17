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
  // Variantes locales: el nombre lleva el hash del original, nunca cambian.
  async headers() {
    return [{ source: "/_opt/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
};

export default nextConfig;
