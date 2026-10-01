import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import { PropertyCard, type Property } from "@/components/properties/PropertyCard";
import type { SectionCopy } from "@/lib/section-copy";
import { DEFAULT_SECTIONS } from "@/lib/section-copy";

// Reemplaza a la galería estática en la home cuando el módulo de propiedades está
// activo: inventario real (destacadas primero) con link al buscador completo.
// Las exclusivas no se repiten acá: tienen su propia sección.
export function FeaturedProperties({ properties, copy = DEFAULT_SECTIONS.properties }: { properties: Property[]; copy?: SectionCopy["properties"] }) {
  const pool = properties.filter((p) => !p.exclusive);
  const featured = [...(pool.length ? pool : properties)].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 6);

  return (
    <section id="propiedades" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            subtitle={copy.subtitle}
          />
          <Link
            href="/propiedades"
            className="inline-flex min-h-11 items-center gap-2 border border-foreground/30 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {copy.cta} ({properties.length}) <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 90}>
              <PropertyCard property={p} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
