import { Quote, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import type { ClientConfig } from "@/config/schema";
import type { SectionCopy } from "@/lib/section-copy";

export function TestimonialsInmobiliaria({ testimonials, copy }: { testimonials: NonNullable<ClientConfig["testimonials"]>; copy: SectionCopy["testimonials"] }) {
  return (
    <section aria-labelledby="testimonios-titulo" className="py-20 sm:py-28">
      <Container>
        <SectionHeading id="testimonios-titulo" eyebrow={copy.eyebrow} title={copy.title} align="center" />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <figure className="flex h-full flex-col border-t-2 border-primary pt-6">
                <Quote size={28} className="text-primary/30" aria-hidden />
                <blockquote className="mt-4 flex-1 font-heading text-lg leading-relaxed text-foreground/85">{t.quote}</blockquote>
                <figcaption className="mt-6 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-foreground">{t.name}</span>
                  {t.rating && (
                    <span className="flex gap-0.5 text-primary" aria-label={`${t.rating} de 5 estrellas`}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={14} fill={j < t.rating! ? "currentColor" : "none"} aria-hidden />
                      ))}
                    </span>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
