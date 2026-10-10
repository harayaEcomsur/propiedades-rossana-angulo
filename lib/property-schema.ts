import type { Property } from "@/components/properties/PropertyCard";
import { OPERATION_LABEL } from "@/components/properties/PropertyCard";
import { absoluteUrl, organizationId } from "@/lib/seo";

// JSON-LD de las propiedades: la ficha como RealEstateListing (con su oferta y
// las características de la vivienda) y el listado como ItemList. Google no
// muestra resultados enriquecidos para inmuebles, pero estos datos le sirven a
// él y sobre todo a los buscadores con IA para entender y citar cada ficha.

const ACCOMMODATION: Record<Property["type"], string> = {
  casa: "House",
  departamento: "Apartment",
  oficina: "Place",
  local: "Place",
  terreno: "Place",
  parcela: "Place",
  bodega: "Place",
  estacionamiento: "Place",
};

// "UF 8.500" → 8500 CLF (código ISO de la UF); "$670.000/mes + $120.000 GC" →
// 670000 CLP (el primer monto es el precio). Sin monto reconocible: undefined.
export function parsePrice(text: string): { price: number; currency: "CLF" | "CLP" } | undefined {
  const uf = text.match(/UF\s*([\d.]+(?:,\d+)?)/i) ?? text.match(/([\d.]+(?:,\d+)?)\s*UF/i);
  if (uf) return { price: Number(uf[1].replace(/\./g, "").replace(",", ".")), currency: "CLF" };
  const clp = text.match(/\$\s*([\d.]+)/);
  if (clp) return { price: Number(clp[1].replace(/\./g, "")), currency: "CLP" };
  return undefined;
}

export function propertyJsonLd(p: Property) {
  const url = absoluteUrl(`/propiedades/${p.slug}`);
  const price = parsePrice(p.price);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": `${url}#listing`,
        url,
        name: p.title,
        description: p.description,
        image: p.images.map((img) => absoluteUrl(img)),
        about: {
          "@type": ACCOMMODATION[p.type],
          name: p.title,
          address: { "@type": "PostalAddress", addressLocality: p.comuna, addressCountry: "CL" },
          numberOfRooms: p.bedrooms,
          numberOfBedrooms: p.bedrooms,
          numberOfBathroomsTotal: p.bathrooms,
          floorSize: p.area ? { "@type": "QuantitativeValue", value: p.area, unitCode: "MTK" } : undefined,
        },
        offers: {
          "@type": "Offer",
          businessFunction: p.operation === "venta" ? "http://purl.org/goodrelations/v1#Sell" : "http://purl.org/goodrelations/v1#LeaseOut",
          description: `${OPERATION_LABEL[p.operation]}: ${p.price}`,
          price: price?.price,
          priceCurrency: price?.currency,
          availability: "https://schema.org/InStock",
          offeredBy: { "@id": organizationId() },
        },
        provider: { "@id": organizationId() },
      },
      breadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: "Propiedades", path: "/propiedades" },
        { name: p.title, path: `/propiedades/${p.slug}` },
      ]),
    ],
  };
}

// `extra`: un nivel más en la miga de pan (p. ej. la página de una comuna).
export function propertyListJsonLd(properties: Property[], extra?: { name: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: extra ? `Propiedades en venta y arriendo en ${extra.name}` : "Propiedades en venta y arriendo",
        numberOfItems: properties.length,
        itemListElement: properties.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: absoluteUrl(`/propiedades/${p.slug}`),
          name: `${p.title} — ${OPERATION_LABEL[p.operation]}, ${p.comuna}, ${p.price}`,
        })),
      },
      breadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: "Propiedades", path: "/propiedades" },
        ...(extra ? [extra] : []),
      ]),
    ],
  };
}

function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
