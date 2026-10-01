import { MessageCircle, Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import { faqJsonLd } from "@/components/sections/FAQ";
import { jsonLdString } from "@/lib/seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { ClientConfig } from "@/config/schema";
import type { SectionCopy } from "@/lib/section-copy";

// Dos columnas: encabezado fijo con salida a WhatsApp a la izquierda, acordeón
// nativo (<details>, accesible sin JS) a la derecha. Mismo JSON-LD FAQPage.
export function FAQInmobiliaria({ items, whatsapp, copy }: { items: NonNullable<ClientConfig["faq"]>; whatsapp?: string; copy: SectionCopy["faq"] }) {
  return (
    <section id="preguntas-frecuentes" aria-labelledby="faq-titulo" className="py-20 sm:py-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd(items)) }} />
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading id="faq-titulo" eyebrow={copy.eyebrow} title={copy.title} />
          {whatsapp && (
            <a
              href={buildWhatsAppLink(whatsapp, "Hola! Tengo una consulta que no está en las preguntas frecuentes")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-11 items-center gap-2 border border-foreground/30 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <MessageCircle size={16} aria-hidden /> {copy.cta}
            </a>
          )}
        </div>
        <div className="divide-y divide-foreground/15 border-y border-foreground/15">
          {items.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 font-heading text-lg font-semibold text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus size={20} className="shrink-0 text-primary transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="pb-6 pr-10 leading-relaxed text-foreground/70">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
