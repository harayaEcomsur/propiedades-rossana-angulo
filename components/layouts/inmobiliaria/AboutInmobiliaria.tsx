import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import type { ClientConfig } from "@/config/schema";
import type { SectionCopy } from "@/lib/section-copy";

// "Quién te asesora": foto con un bloque de color desplazado detrás (detalle
// editorial) y el texto al lado.
export function AboutInmobiliaria({ about, copy }: { about: ClientConfig["about"]; copy: SectionCopy["about"] }) {
  return (
    <section id="nosotros" className="py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {about.imageUrl && (
          <Reveal className="relative">
            <div aria-hidden className="absolute -bottom-4 -left-4 h-full w-full bg-primary/10 sm:-bottom-6 sm:-left-6" />
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src={about.imageUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
        )}
        <Reveal delay={100}>
          <SectionHeading eyebrow={copy.eyebrow} title={about.title} />
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/75">{about.body}</p>
        </Reveal>
      </Container>
    </section>
  );
}
