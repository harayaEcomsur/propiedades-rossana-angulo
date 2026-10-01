import { Quote, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { InfiniteCarousel } from "@/components/ui/InfiniteCarousel";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import type { ClientConfig } from "@/config/schema";
import type { SectionCopy } from "@/lib/section-copy";

type Testimonial = NonNullable<ClientConfig["testimonials"]>[number];

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
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
  );
}

// Hasta 3 testimonios: grilla fija (como siempre). Con más: carrusel infinito
// con autoplay, 3 por vista en escritorio, 2 en tablet y 1 en celular.
export function TestimonialsInmobiliaria({ testimonials, copy }: { testimonials: Testimonial[]; copy: SectionCopy["testimonials"] }) {
  const asCarousel = testimonials.length > 3;
  return (
    <section aria-labelledby="testimonios-titulo" className="py-20 sm:py-28">
      <Container>
        <SectionHeading id="testimonios-titulo" eyebrow={copy.eyebrow} title={copy.title} align="center" />
        {asCarousel ? (
          <div className="mt-14">
            <InfiniteCarousel
              slides={testimonials.map((t) => (
                <TestimonialCard key={t.name + t.quote.slice(0, 20)} t={t} />
              ))}
              ariaLabel="Testimonios de clientes"
              slideClassName="w-[88%] sm:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-4rem)/3)]"
              gapClassName="gap-8"
              interval={6000}
            />
          </div>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <TestimonialCard t={t} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
