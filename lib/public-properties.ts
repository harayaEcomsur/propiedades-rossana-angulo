import { clientConfig } from "@/config/client.config";
import { listProperties, type REProperty } from "@/lib/realestate-store";
import type { Property } from "@/components/properties/PropertyCard";

// Inventario que ve el público (home, /propiedades, fichas y asistente IA).
// Manda lo que se carga en el panel /inmobiliaria/admin (activas y
// reservadas, con al menos una foto). Mientras el panel no tenga ninguna, se
// muestra el inventario de ejemplo del config — así el sitio nunca queda vacío.

const TYPE_MAP: Record<REProperty["type"], Property["type"]> = {
  casa: "casa",
  departamento: "departamento",
  oficina: "oficina",
  parcela: "parcela",
  local_comercial: "local",
  terreno: "terreno",
  sitio: "terreno",
  loteo: "terreno",
  bodega: "bodega",
  estacionamiento: "estacionamiento",
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function propertySlug(p: Pick<REProperty, "id" | "title">): string {
  return `${slugify(p.title)}-${p.id.slice(0, 6)}`;
}

export function formatPropertyPrice(p: Pick<REProperty, "price" | "currency" | "operation"> & { maintenanceFee?: number }): string {
  if (p.price === undefined || p.price === null) return "Consultar";
  const amount = p.currency === "UF" ? `UF ${p.price.toLocaleString("es-CL")}` : `$${p.price.toLocaleString("es-CL")}`;
  if (p.operation !== "arriendo" || p.currency === "UF") return amount;
  // Arriendo: el gasto común se muestra junto al valor, como se publica en Instagram.
  return p.maintenanceFee ? `${amount}/mes + $${p.maintenanceFee.toLocaleString("es-CL")} GC` : `${amount}/mes`;
}

function toPublic(p: REProperty): Property {
  return {
    slug: propertySlug(p),
    title: p.title,
    operation: p.operation,
    type: TYPE_MAP[p.type] ?? "casa",
    // La comuna agrupa el filtro del buscador (Concón, Viña del Mar…); el barrio
    // o sector va en el título y la descripción.
    comuna: p.city || p.neighborhood || p.region || "",
    price: formatPropertyPrice(p),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.coveredArea ?? p.totalArea,
    parking: p.parkingSpots,
    description: p.description ?? "",
    images: p.photos,
    // El video propio (MP4 copiado a Blob) manda; si no hay y la ficha se
    // importó desde un reel, se usa el reproductor de Instagram con ese reel.
    video: p.video ?? (p.instagramUrl && /\/(reel|reels|tv)\//.test(p.instagramUrl) ? p.instagramUrl : undefined),
    // Las reservadas siguen visibles pero no se destacan en la home.
    featured: p.status === "activa",
    exclusive: Boolean(p.exclusive),
  };
}

export async function getPublicProperties(): Promise<Property[]> {
  if (!clientConfig.modules.propiedades) return [];
  const fromPanel = clientConfig.modules.inmobiliariaAdmin
    ? (await listProperties()).filter((p) => (p.status === "activa" || p.status === "reservada") && p.photos.length > 0)
    : [];
  return fromPanel.length > 0 ? fromPanel.map(toPublic) : clientConfig.properties ?? [];
}
