// Qué datos le faltan a una ficha para estar completa. Una sola regla para
// el formulario del panel (aviso antes de publicar), la API (correo a la
// administración al publicar una incompleta) y el resumen semanal. Sin
// imports de servidor: se usa también en el navegador.

export interface CompletenessInput {
  type: string;
  neighborhood?: string;
  city?: string;
  price?: number;
  description?: string;
  photos: string[];
  bedrooms?: number;
  bathrooms?: number;
  coveredArea?: number;
  totalArea?: number;
}

export const MIN_PHOTOS = 5;
export const MIN_DESCRIPTION = 80;

const DWELLING = new Set(["casa", "departamento"]);
const LAND = new Set(["terreno", "parcela", "sitio", "loteo"]);
const BUILT = new Set(["oficina", "local_comercial", "bodega"]);

export function missingFields(p: CompletenessInput): string[] {
  const missing: string[] = [];
  if (!p.neighborhood?.trim() && !p.city?.trim()) missing.push("comuna o barrio");
  if (p.price === undefined || p.price === null) missing.push("precio");
  if ((p.description?.trim().length ?? 0) < MIN_DESCRIPTION) missing.push(`descripción (mínimo ${MIN_DESCRIPTION} caracteres)`);
  if (p.photos.length < MIN_PHOTOS) missing.push(`fotos (tiene ${p.photos.length}, mínimo ${MIN_PHOTOS})`);
  if (DWELLING.has(p.type)) {
    if (p.bedrooms === undefined || p.bedrooms === null) missing.push("dormitorios");
    if (p.bathrooms === undefined || p.bathrooms === null) missing.push("baños");
    if (p.coveredArea == null && p.totalArea == null) missing.push("superficie (m²)");
  } else if (BUILT.has(p.type)) {
    if (p.coveredArea == null && p.totalArea == null) missing.push("superficie (m²)");
  } else if (LAND.has(p.type)) {
    if (p.totalArea == null) missing.push("superficie total (m²)");
  }
  return missing;
}
