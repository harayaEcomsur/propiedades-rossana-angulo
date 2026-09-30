import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/IconResolver";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import type { ClientConfig } from "@/config/schema";

// Servicios estilo inmobiliaria premium: sin cards — lista aireada con líneas
// finas, número correlativo y encabezado de sección alineado a la izquierda.
export function ServicesInmobiliaria({ services }: { services: ClientConfig["services"] }) {
  if (!services.length) return null;

  return (
    <section id="servicios" aria-labelledby="servicios-titulo" className="py-20 sm:py-28">
      <Container>
        <SectionHeading id="servicios-titulo" eyebrow="Servicios" title="Un servicio integral, de la tasación a la entrega de llaves" />
        <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 80} className="group border-t border-foreground/15 pt-6">
              <div className="flex items-start justify-between gap-4">
                <Icon name={s.icon} className="h-6 w-6 text-primary" aria-hidden />
                <span className="font-heading text-sm text-foreground/30">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{s.description}</p>
              {s.price && <p className="mt-3 text-sm font-semibold text-primary">{s.price}</p>}
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
