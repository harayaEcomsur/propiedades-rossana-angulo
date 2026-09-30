import Link from "next/link";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { PropertyCard, type Property } from "@/components/properties/PropertyCard";

// "En Exclusiva" (ref: Property Partners): franja oscura con titular grande y
// las fichas montadas sobre el borde inferior. Solo aparece si hay al menos
// una propiedad marcada como exclusiva en el panel o en el config.
export function ExclusiveInmobiliaria({ properties }: { properties: Property[] }) {
  const exclusives = properties.filter((p) => p.exclusive).slice(0, 3);
  if (exclusives.length === 0) return null;

  return (
    <section id="exclusivas" aria-labelledby="exclusivas-titulo" className="pb-4 sm:pb-8">
      <div className="bg-accent pb-40 pt-20 text-center sm:pb-48 sm:pt-24">
        <Container>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            <Star size={12} fill="currentColor" className="text-primary" aria-hidden /> Solo con nosotros
          </p>
          <h2 id="exclusivas-titulo" className="mt-4 font-heading text-4xl font-bold text-white sm:text-6xl">
            En Exclusiva
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-heading text-2xl text-primary">Conoce propiedades que solo encontrarás aquí</p>
          <Link
            href="/propiedades?exclusivas=1"
            className="mt-8 inline-flex min-h-11 items-center bg-primary px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            Ver exclusivas
          </Link>
        </Container>
      </div>
      <Container className="-mt-28 sm:-mt-36">
        <div className={`grid grid-cols-1 gap-8 ${exclusives.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-md"} ${exclusives.length > 2 ? "lg:grid-cols-3" : ""}`}>
          {exclusives.map((p, i) => (
            <Reveal key={p.slug} delay={i * 90}>
              <PropertyCard property={p} variant="card" />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
