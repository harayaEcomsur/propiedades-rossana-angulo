import sharp from "sharp";
import { ALL_WIDTHS } from "@/lib/image-sizes.mjs";

// Redimensionador propio para imágenes externas (fotos de propiedades en
// Vercel Blob, Instagram). Reemplaza al optimizador de Vercel (/_next/image):
// cada combinación url+ancho se procesa una sola vez y la CDN la guarda un año
// (las fotos subidas no cambian: una foto nueva es otra URL). Solo hosts
// conocidos y anchos de next/image, para no ser un proxy abierto.
const ALLOWED = [/(^|\.)public\.blob\.vercel-storage\.com$/, /(^|\.)cdninstagram\.com$/, /(^|\.)fbcdn\.net$/];
const WIDTHS = [...ALL_WIDTHS].sort((a, b) => a - b);

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const requested = Number(params.get("w")) || 640;
  const w = WIDTHS.find((x) => x >= requested) ?? WIDTHS[WIDTHS.length - 1];
  const q = Math.min(Math.max(Number(params.get("q")) || 75, 30), 90);
  let target: URL;
  try {
    target = new URL(params.get("url") ?? "");
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED.some((re) => re.test(target.hostname))) {
    return new Response("host not allowed", { status: 400 });
  }

  const upstream = await fetch(target, { cache: "no-store" });
  if (!upstream.ok) return new Response("upstream error", { status: 502, headers: { "Cache-Control": "no-store" } });
  try {
    const out = await sharp(Buffer.from(await upstream.arrayBuffer()))
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: q })
      .toBuffer();
    return new Response(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("bad image", { status: 415, headers: { "Cache-Control": "no-store" } });
  }
}
