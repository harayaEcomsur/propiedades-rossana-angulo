import { clientConfig } from "@/config/client.config";
import { formatPropertyPrice, propertySlug } from "@/lib/public-properties";
import type { PropertyType, REProperty } from "@/lib/realestate-store";

// Traducción entre una propiedad del panel y el texto de una publicación de
// Instagram, en ambos sentidos.

// ---------- Instagram → panel ----------

// Datos que se pueden deducir del texto de una publicación. Es un borrador para
// el formulario: la corredora revisa y completa antes de guardar.
export interface PropertyDraft {
  title?: string;
  operation?: REProperty["operation"];
  type?: PropertyType;
  price?: number;
  currency?: "CLP" | "UF";
  bedrooms?: number;
  bathrooms?: number;
  coveredArea?: number;
  parkingSpots?: number;
  description?: string;
}

function toNumber(s: string): number | undefined {
  // "4.500" / "4,5" / "120.000.000" en formato chileno.
  const clean = s.replace(/\./g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const TYPE_WORDS: Array<[RegExp, PropertyType]> = [
  [/\b(depto|departamento|dpto)\b/i, "departamento"],
  [/\bcasa\b/i, "casa"],
  [/\bparcela\b/i, "parcela"],
  [/\boficina\b/i, "oficina"],
  [/\blocal\b/i, "local_comercial"],
  [/\bterreno\b/i, "terreno"],
  [/\bsitio\b/i, "sitio"],
  [/\bbodega\b/i, "bodega"],
  [/\bestacionamiento\b/i, "estacionamiento"],
];

export function draftFromCaption(caption: string): PropertyDraft {
  const text = caption.trim();
  // Título: primera línea con texto, sin hashtags ni emojis sueltos al borde.
  const firstLine = text.split("\n").map((l) => l.replace(/#\S+/g, "").trim()).find((l) => /[a-záéíóúñ]/i.test(l)) ?? "";
  const title = firstLine.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N})]+$/gu, "").slice(0, 160) || undefined;

  const operation: PropertyDraft["operation"] = /temporada/i.test(text)
    ? "arriendo_temporada"
    : /\b(arriendo|arrienda|se arrienda)\b/i.test(text)
      ? "arriendo"
      : /\b(venta|vendo|se vende)\b/i.test(text)
        ? "venta"
        : undefined;

  const type = TYPE_WORDS.find(([re]) => re.test(text))?.[1];

  let price: number | undefined;
  let currency: PropertyDraft["currency"];
  const uf = text.match(/UF\s*([\d.,]+)/i) ?? text.match(/([\d.,]+)\s*UF\b/i);
  const clp = text.match(/\$\s*([\d.]+)/);
  if (uf) {
    price = toNumber(uf[1]);
    currency = "UF";
  } else if (clp) {
    price = toNumber(clp[1]);
    currency = "CLP";
  }

  const num = (re: RegExp) => {
    const m = text.match(re);
    return m ? toNumber(m[1]) : undefined;
  };

  return {
    title,
    operation,
    type,
    price,
    currency,
    bedrooms: num(/(\d+)\s*(?:d\b|dorm|dormitorios?|habitaciones?|piezas?)/i),
    bathrooms: num(/(\d+)\s*(?:b\b|baños?)/i),
    coveredArea: num(/([\d.,]+)\s*(?:m2|m²|mts2?|metros)/i),
    parkingSpots: num(/(\d+)\s*(?:estacionamientos?|estac)/i),
    // Sin hashtags: en el sitio no aportan y ensucian la ficha.
    description: text.replace(/(^|\s)#\S+/g, "").replace(/\n{3,}/g, "\n\n").trim() || undefined,
  };
}

// ---------- panel → Instagram ----------

const OPERATION_TEXT: Record<REProperty["operation"], string> = {
  venta: "En venta",
  arriendo: "En arriendo",
  arriendo_temporada: "Arriendo de temporada",
};

export function captionForProperty(p: REProperty): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const location = [p.neighborhood, p.city].filter(Boolean).join(", ");
  const specs = [
    p.bedrooms !== undefined && `🛏 ${p.bedrooms} dormitorios`,
    p.bathrooms !== undefined && `🛁 ${p.bathrooms} baños`,
    (p.coveredArea ?? p.totalArea) !== undefined && `📐 ${p.coveredArea ?? p.totalArea} m²`,
    p.parkingSpots !== undefined && p.parkingSpots > 0 && `🚗 ${p.parkingSpots} estacionamiento${p.parkingSpots > 1 ? "s" : ""}`,
  ].filter(Boolean);

  const lines = [
    `🏡 ${p.title}`,
    `${OPERATION_TEXT[p.operation]}${location ? ` · 📍 ${location}` : ""}`,
    `💰 ${formatPropertyPrice(p)}`,
    specs.length ? specs.join("\n") : null,
    // Instagram corta en 2.200 caracteres: se acota la descripción, no los datos.
    p.description ? `\n${p.description.length > 1500 ? p.description.slice(0, 1500).trimEnd() + "…" : p.description}` : null,
    site ? `\nFicha completa en ${site.replace(/\/$/, "")}/propiedades/${propertySlug(p)}` : null,
    clientConfig.contact.whatsapp ? `📲 WhatsApp +${clientConfig.contact.whatsapp}` : null,
  ].filter(Boolean);

  const hashtags = ["#propiedades", "#corredoradepropiedades", `#${p.operation === "venta" ? "venta" : "arriendo"}`];
  const place = (p.neighborhood || p.city)?.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (place) hashtags.push(`#${place}`);

  return `${lines.join("\n")}\n\n${hashtags.join(" ")}`;
}
