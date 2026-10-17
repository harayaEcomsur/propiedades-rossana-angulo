// Pre-genera en AVIF y WebP las imágenes locales del sitio (public/clients/<cliente>)
// en cada ancho que usa next/image, y escribe lib/image-manifest.json. El
// loader (lib/image-loader.ts) sirve esas variantes directo desde la CDN, sin
// el optimizador de Vercel. Corre antes de cada build (npm "prebuild") y solo
// procesa lo nuevo o cambiado; los archivos generados se versionan. El nombre
// lleva un hash del original: si la imagen cambia, cambia la URL, así que se
// pueden cachear un año (next.config.mjs → headers de /_opt).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { ALL_WIDTHS } from "../lib/image-sizes.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "public/clients/propiedades-rossana-angulo");
const OUT = path.join(ROOT, "public/_opt");
const MANIFEST = path.join(ROOT, "lib/image-manifest.json");
// AVIF ~50 se ve como WebP ~75 y pesa bastante menos.
const FORMATS = { avif: { quality: 50 }, webp: { quality: 75 } };

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : /\.(jpe?g|png|webp)$/i.test(d.name) ? [p] : [];
  });
}

const manifest = {};
const keep = new Set();
let made = 0;
for (const file of walk(SRC)) {
  const rel = "/" + path.relative(path.join(ROOT, "public"), file).split(path.sep).join("/");
  const { width: original } = await sharp(file).metadata();
  // Anchos menores que el original, más el original si es menor que el mayor
  // ancho pedido (para no agrandar nunca).
  const widths = ALL_WIDTHS.filter((w) => w < original);
  if (original < Math.max(...ALL_WIDTHS) && !widths.includes(original)) widths.push(original);
  widths.sort((a, b) => a - b);
  const hash = crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
  // Un solo segmento (sin "/") para la regla de next.config que elige el formato.
  const base = `${rel.replace(/^\/clients\//, "").replace(/\.[^.]+$/, "").replaceAll("/", "__")}-${hash}`;
  for (const w of widths) {
    for (const [fmt, opts] of Object.entries(FORMATS)) {
      const out = path.join(OUT, `${base}-${w}.${fmt}`);
      keep.add(out);
      if (fs.existsSync(out)) continue;
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await sharp(file).rotate().resize({ width: w, withoutEnlargement: true })[fmt](opts).toFile(out);
      made++;
    }
  }
  // Sin extensión: next.config.mjs reescribe /img/<archivo> a .avif o .webp
  // según lo que acepte el navegador.
  manifest[rel] = { base: `/img/${base}`, widths };
}
// Variantes de versiones anteriores (otro hash) o de imágenes borradas.
let removed = 0;
for (const f of fs.existsSync(OUT) ? walk(OUT) : []) if (!keep.has(f)) (fs.unlinkSync(f), removed++);
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
console.log(`imágenes locales: ${Object.keys(manifest).length} archivos, ${made} variantes nuevas, ${removed} borradas`);
