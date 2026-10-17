import crypto from "node:crypto";
import sharp from "sharp";
import { head, put } from "@vercel/blob";
import { ALL_WIDTHS } from "@/lib/image-sizes.mjs";

// Variantes optimizadas de imágenes externas (ver app/api/img/route.ts).
// Cada variante (url + ancho + calidad + formato) se codifica UNA vez y se
// guarda en Blob (img-cache/): la caché de la CDN se vacía en cada deploy y
// codificar AVIF toma segundos, así que después solo se lee de Blob.

export type ImgFormat = "avif" | "webp";
export const ALLOWED_HOSTS = [/(^|\.)public\.blob\.vercel-storage\.com$/, /(^|\.)cdninstagram\.com$/, /(^|\.)fbcdn\.net$/];
const WIDTHS = [...ALL_WIDTHS].sort((a, b) => a - b);
const HAS_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export function snapWidth(requested: number): number {
  return WIDTHS.find((x) => x >= requested) ?? WIDTHS[WIDTHS.length - 1];
}

export class ImageError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function getVariant(src: URL, width: number, quality: number, fmt: ImgFormat): Promise<Buffer> {
  const key = `img-cache/${crypto.createHash("sha1").update(src.href).digest("hex")}-${width}-q${quality}.${fmt}`;

  // 1. Ya procesada antes: se lee de Blob, sin volver a codificar.
  if (HAS_BLOB) {
    try {
      const cached = await fetch((await head(key)).url);
      if (cached.ok) return Buffer.from(await cached.arrayBuffer());
    } catch {
      // no existe todavía
    }
  }

  // 2. Primera vez: descargar, redimensionar, codificar y guardar en Blob.
  const upstream = await fetch(src, { cache: "no-store" });
  if (!upstream.ok) throw new ImageError(502, "upstream error");
  let out: Buffer;
  try {
    const img = sharp(Buffer.from(await upstream.arrayBuffer())).rotate().resize({ width, withoutEnlargement: true });
    // AVIF ~50 se ve como WebP ~75.
    out = await (fmt === "avif" ? img.avif({ quality: Math.round(quality * 0.67) }) : img.webp({ quality })).toBuffer();
  } catch {
    throw new ImageError(415, "bad image");
  }
  if (HAS_BLOB) {
    await put(key, out, { access: "public", contentType: `image/${fmt}`, addRandomSuffix: false, allowOverwrite: true }).catch(() => {});
  }
  return out;
}

// Anchos que de verdad piden las tarjetas y fichas (celular y escritorio, con
// pantallas de alta densidad).
const WARM_WIDTHS = [384, 640, 750, 828, 1080];

// Genera de antemano las variantes de fotos recién subidas, para que el primer
// visitante no espere la codificación. Corre en segundo plano.
export async function warmVariants(urls: string[]): Promise<void> {
  const jobs = urls.flatMap((u) => WARM_WIDTHS.flatMap((w) => (["avif", "webp"] as const).map((f) => [u, w, f] as const)));
  for (let i = 0; i < jobs.length; i += 4) {
    await Promise.all(jobs.slice(i, i + 4).map(([u, w, f]) => getVariant(new URL(u), w, 75, f).catch(() => {})));
  }
}
