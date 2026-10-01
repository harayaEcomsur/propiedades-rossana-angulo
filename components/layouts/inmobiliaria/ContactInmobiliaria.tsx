import { Clock, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import { ContactForm } from "@/components/sections/ContactForm";
import { MapEmbed } from "@/components/sections/MapEmbed";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { instagramHandle } from "@/lib/instagram";
import type { ClientConfig } from "@/config/schema";
import type { SectionCopy } from "@/lib/section-copy";

export function ContactInmobiliaria({ contact, showForm, copy }: { contact: ClientConfig["contact"]; showForm: boolean; copy: SectionCopy["contact"] }) {
  const instagram = contact.socials?.find((s) => s.platform === "instagram")?.url;
  const hours = contact.hours
    ?.map((h) => (h.closed ? `${h.day}: cerrado` : `${h.day}: ${h.open} a ${h.close}`))
    .join(" · ");

  const items = [
    contact.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: contact.phone ?? `+${contact.whatsapp}`,
      href: buildWhatsAppLink(contact.whatsapp, contact.whatsappPrefilledMessage),
      external: true,
    },
    contact.phone && { icon: Phone, label: "Teléfono", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    hours && { icon: Clock, label: "Horario", value: hours },
    contact.address && { icon: MapPin, label: "Ubicación", value: contact.address },
    instagram && { icon: Instagram, label: "Instagram", value: instagramHandle(instagram), href: instagram, external: true },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string; external?: boolean }[];

  return (
    <section id="contacto" aria-labelledby="contacto-titulo" className="bg-foreground/[0.03] py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            id="contacto-titulo"
            eyebrow={copy.eyebrow}
            title={copy.title}
            subtitle={copy.subtitle}
          />
          <ul className="mt-10 space-y-5">
            {items.map(({ icon: Icon, label, value, href, external }) => (
              <li key={label} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary/10 text-primary">
                  <Icon size={18} aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="font-medium text-foreground">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {contact.address && (
            <div className="mt-10 overflow-hidden">
              <MapEmbed query={contact.mapQuery ?? contact.address} />
            </div>
          )}
        </div>
        {showForm && (
          <div className="h-fit bg-background p-6 shadow-[0_10px_40px_-16px_rgba(0,0,0,0.3)] sm:p-10">
            <h3 className="font-heading text-2xl font-semibold text-foreground">{copy.formTitle}</h3>
            <p className="mb-6 mt-2 text-sm text-foreground/65">{copy.formSubtitle}</p>
            <ContactForm squared />
          </div>
        )}
      </Container>
    </section>
  );
}
