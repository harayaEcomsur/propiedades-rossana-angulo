import crypto from "node:crypto";
import sharp from "sharp";
import { head, put } from "@vercel/blob";
import { ALL_WIDTHS } from "@/lib/image-sizes.mjs";

// Redimensionador propio para imágenes externas (fotos de propiedades en
// Vercel Blob, Instagram). Reemplaza al optimizador de Vercel (/_next/image).
//
// - AVIF a quien lo acepta (pesa ~20–40% menos que WebP), WebP al resto. La
//   CDN guarda una copia por formato (Vary: Accept) durante un año.
// - La caché de la CDN se vacía en cada deploy, y codificar AVIF toma 1–3 s:
//   por eso cada variante procesada se guarda también en Blob (img-cache/).
//   Se codifica UNA vez en la vida; después de un deploy solo se lee de Blob.
// - Solo hosts conocidos y anchos de next/image, para no ser un proxy abierto.
const ALLOWED = [/(^|\.)public\.blob\.vercel-storage\.com$/, /(^|\.)cdninstagram\.com$/, /(^|\.)fbcdn\.net$/];
const WIDTHS = [...ALL_WIDTHS].sort((a, b) => a - b);
const HAS_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function respond(body: ArrayBuffer | Buffer, type: string) {
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": type,
      Vary: "Accept",
      "Cache-Control": "public, max-age=31536000, immutable",
      "CDN-Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

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

  const fmt = (req.headers.get("accept") ?? "").includes("image/avif") ? "avif" : "webp";
  const type = `image/${fmt}`;
  const key = `img-cache/${crypto.createHash("sha1").update(target.href).digest("hex")}-${w}-q${q}.${fmt}`;

  // 1. Ya procesada antes (otro deploy): se lee de Blob, sin volver a codificar.
  if (HAS_BLOB) {
    try {
      const cached = await fetch((await head(key)).url);
      if (cached.ok) return respond(await cached.arrayBuffer(), type);
    } catch {
      // no existe todavía
    }
  }

  // 2. Primera vez: descargar, redimensionar, codificar y guardar en Blob.
  const upstream = await fetch(target, { cache: "no-store" });
  if (!upstream.ok) return new Response("upstream error", { status: 502, headers: { "Cache-Control": "no-store" } });
  let out: Buffer;
  try {
    const img = sharp(Buffer.from(await upstream.arrayBuffer())).rotate().resize({ width: w, withoutEnlargement: true });
    // AVIF ~50 se ve como WebP ~75.
    out = await (fmt === "avif" ? img.avif({ quality: Math.round(q * 0.67) }) : img.webp({ quality: q })).toBuffer();
  } catch {
    return new Response("bad image", { status: 415, headers: { "Cache-Control": "no-store" } });
  }
  if (HAS_BLOB) {
    await put(key, out, { access: "public", contentType: type, addRandomSuffix: false, allowOverwrite: true }).catch(() => {});
  }
  return respond(out, type);
}
