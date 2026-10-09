import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/IconResolver";
import { Reveal } from "@/components/ui/Reveal";
import type { ClientConfig } from "@/config/schema";

// Franja de diferenciadores justo bajo el hero: responde "¿por qué ellos?"
// antes de mostrar propiedades.
export function PillarsInmobiliaria({ pillars }: { pillars: NonNullable<ClientConfig["pillars"]> }) {
  if (!pillars.length) return null;
  return (
    <section aria-label="Por qué elegirnos" className="border-b border-foreground/10 bg-background">
      <Container className="grid grid-cols-1 divide-y divide-foreground/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {pillars.map((p, i) => (
          <Reveal key={p.title} delay={i * 80} className="py-8 sm:px-6 sm:py-10 lg:first:pl-0">
            <Icon name={p.icon} className="h-6 w-6 text-primary" aria-hidden />
            {/* h2: es el primer nivel bajo el h1 del hero (un h3 aquí rompe el orden de títulos). */}
            <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">{p.title}</h2>
            {p.text && <p className="mt-1.5 text-sm leading-relaxed text-foreground/65">{p.text}</p>}
          </Reveal>
        ))}
      </Container>
    </section>
  );
}
