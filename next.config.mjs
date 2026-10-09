/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // AVIF pesa bastante menos que WebP con la misma calidad: baja el tiempo
    // de carga de la imagen principal (LCP) en celular. WebP queda de respaldo.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
