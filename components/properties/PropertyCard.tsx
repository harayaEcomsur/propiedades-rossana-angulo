import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Ruler, Car, MapPin, Play, Star } from "lucide-react";
import type { ClientConfig } from "@/config/schema";

export type Property = NonNullable<ClientConfig["properties"]>[number];

export const OPERATION_LABEL: Record<Property["operation"], string> = {
  venta: "Venta",
  arriendo: "Arriendo",
  arriendo_temporada: "Arriendo temporada",
};

// `card` = tarjeta con fondo blanco y sombra (para ir sobre la franja oscura de
// "En Exclusiva"); `plain` = editorial, sin caja, sobre el fondo del sitio.
export function PropertyCard({
  property,
  variant = "plain",
  priority = false,
  eager = false,
}: {
  property: Property;
  variant?: "plain" | "card";
  priority?: boolean;
  eager?: boolean;
}) {
  const specs = [
    property.bedrooms != null && { icon: BedDouble, label: `${property.bedrooms} dorm.`, sr: `${property.bedrooms} dormitorios` },
    property.bathrooms != null && { icon: Bath, label: `${property.bathrooms} baños`, sr: `${property.bathrooms} baños` },
    property.area != null && { icon: Ruler, label: `${property.area} m²`, sr: `${property.area} metros cuadrados` },
    property.parking != null && property.parking > 0 && { icon: Car, label: `${property.parking} estac.`, sr: `${property.parking} estacionamientos` },
  ].filter(Boolean) as { icon: typeof BedDouble; label: string; sr: string }[];

  const isCard = variant === "card";

  return (
    <Link
      href={`/propiedades/${property.slug}`}
      className={`group flex h-full flex-col overflow-hidden transition-transform duration-300 motion-safe:hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
        isCard ? "bg-white shadow-[0_10px_40px_-12px_rgba(0,0,0,0.35)]" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          priority={priority}
          loading={priority ? undefined : eager ? "eager" : "lazy"}
          sizes="(min-width: 1152px) 370px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground">
            {OPERATION_LABEL[property.operation]}
          </span>
          {property.exclusive && (
            <span className="inline-flex items-center gap-1 bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              <Star size={11} fill="currentColor" aria-hidden /> En Exclusiva
            </span>
          )}
        </div>
        {property.video && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            <Play size={11} fill="currentColor" aria-hidden /> Video
          </span>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${isCard ? "p-5" : "border-b border-foreground/15 pb-5 pt-4"}`}>
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-foreground/55">
          <MapPin size={12} aria-hidden /> {property.comuna}
        </p>
        <h3 className="mt-1.5 font-heading text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {property.title}
        </h3>
        <p className="mt-2 font-heading text-xl font-bold text-primary">{property.price}</p>
        {specs.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 pt-4 text-xs text-foreground/70">
            {specs.map(({ icon: Icon, label, sr }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon size={14} className="text-foreground/45" aria-hidden />
                <span aria-hidden>{label}</span>
                <span className="sr-only">{sr}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
