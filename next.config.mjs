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
};

export default nextConfig;
