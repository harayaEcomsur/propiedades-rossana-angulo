// Loader de next/image (next.config.mjs → images.loaderFile): la
// optimización de imágenes es nuestra, no del optimizador de Vercel.
//  - Locales (/clients/...): variantes AVIF y WebP pre-generadas por
//    scripts/optimize-images.mjs, servidas directo desde la CDN (la regla de
//    next.config.mjs elige el formato según el navegador).
//  - Externas (fotos del panel en Blob, Instagram): /api/img las redimensiona
//    con sharp una vez por ancho y la CDN las guarda un año.
import manifest from "./image-manifest.json";

const LOCAL = manifest as Record<string, { base: string; widths: number[] }>;

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("/")) {
    const entry = LOCAL[src];
    if (!entry) return src; // imagen local sin variantes: tal cual
    const w = entry.widths.find((x) => x >= width) ?? entry.widths[entry.widths.length - 1];
    return `${entry.base}-${w}`;
  }
  return `/api/img?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
