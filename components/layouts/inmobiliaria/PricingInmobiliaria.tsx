import { Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import type { ClientConfig } from "@/config/schema";
import { slugify } from "@/lib/text";
import type { SectionCopy } from "@/lib/section-copy";

// Precios transparentes: el plan destacado va en negro (mismo tono de la
// franja "En Exclusiva") para que se lea como la opción principal.
export function PricingInmobiliaria({ plans, label = "Precios", copy }: { plans: NonNullable<ClientConfig["pricing"]>; label?: string; copy: SectionCopy["pricing"] }) {
  const id = slugify(label);
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="bg-foreground/[0.03] py-20 sm:py-28">
      <Container>
        <SectionHeading
          id={`${id}-titulo`}
          eyebrow={copy.eyebrow || label}
          title={copy.title}
          subtitle={copy.subtitle || undefined}
          align="center"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const dark = plan.highlighted;
            return (
              <Reveal key={plan.name} delay={i * 90}>
                <div className={`flex h-full flex-col p-8 ${dark ? "bg-accent text-white shadow-xl" : "border border-foreground/15 bg-background"}`}>
                  <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${dark ? "text-white/70" : "text-foreground/60"}`}>{plan.name}</h3>
                  <p className={`mt-4 font-heading text-3xl font-bold ${dark ? "text-white" : "text-foreground"}`}>{plan.price}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex gap-3 text-sm leading-relaxed ${dark ? "text-white/85" : "text-foreground/75"}`}>
                        <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
