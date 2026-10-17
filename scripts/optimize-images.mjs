// Pre-genera en WebP las imágenes locales del sitio (public/clients/<cliente>)
// en cada ancho que usa next/image, y escribe lib/image-manifest.json. El
// loader (lib/image-loader.ts) sirve esas variantes directo desde la CDN, sin
// el optimizador de Vercel. Corre antes de cada build (npm "prebuild") y solo
// procesa lo nuevo o cambiado; los archivos generados se versionan.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ALL_WIDTHS } from "../lib/image-sizes.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "public/clients/propiedades-rossana-angulo");
const OUT = path.join(ROOT, "public/_opt");
const MANIFEST = path.join(ROOT, "lib/image-manifest.json");
const QUALITY = 75;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : /\.(jpe?g|png|webp)$/i.test(d.name) ? [p] : [];
  });
}

const manifest = {};
let made = 0;
for (const file of walk(SRC)) {
  const rel = "/" + path.relative(path.join(ROOT, "public"), file).split(path.sep).join("/");
  const { width: original } = await sharp(file).metadata();
  // Anchos menores que el original, más el original si es menor que el mayor
  // ancho pedido (para no agrandar nunca).
  const widths = ALL_WIDTHS.filter((w) => w < original);
  if (original < Math.max(...ALL_WIDTHS) && !widths.includes(original)) widths.push(original);
  widths.sort((a, b) => a - b);
  const base = rel.replace(/^\/clients\//, "").replace(/\.[^.]+$/, "");
  const srcTime = fs.statSync(file).mtimeMs;
  for (const w of widths) {
    const out = path.join(OUT, `${base}-${w}.webp`);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= srcTime) continue;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(file).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
    made++;
  }
  manifest[rel] = { base: `/_opt/${base}`, widths };
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
console.log(`imágenes locales: ${Object.keys(manifest).length} archivos, ${made} variantes nuevas`);
