import { ALLOWED_HOSTS, ImageError, getVariant, snapWidth } from "@/lib/image-variants";

// Redimensionador propio para imágenes externas (fotos de propiedades en
// Vercel Blob, Instagram). Reemplaza al optimizador de Vercel (/_next/image).
// AVIF a quien lo acepta (pesa ~20–40% menos que WebP), WebP al resto; la CDN
// guarda una copia por formato (Vary: Accept) durante un año. Las variantes
// se guardan además en Blob (lib/image-variants.ts). Solo hosts conocidos y
// anchos de next/image, para no ser un proxy abierto.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const w = snapWidth(Number(params.get("w")) || 640);
  const q = Math.min(Math.max(Number(params.get("q")) || 75, 30), 90);
  let target: URL;
  try {
    target = new URL(params.get("url") ?? "");
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.some((re) => re.test(target.hostname))) {
    return new Response("host not allowed", { status: 400 });
  }
  const fmt = (req.headers.get("accept") ?? "").includes("image/avif") ? "avif" : "webp";
  try {
    const out = await getVariant(target, w, q, fmt);
    return new Response(new Uint8Array(out), {
      headers: {
        "Content-Type": `image/${fmt}`,
        Vary: "Accept",
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const status = e instanceof ImageError ? e.status : 500;
    return new Response("image error", { status, headers: { "Cache-Control": "no-store" } });
  }
}
