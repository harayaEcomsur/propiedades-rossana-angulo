import type { ClientConfig } from "@/config/schema";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { slugify } from "@/lib/text";
import { HeaderClient } from "@/components/layout/HeaderClient";

// Encabezado: arma el menú en el servidor y le pasa a la parte interactiva
// solo los datos que necesita (logo, nombre, enlaces y WhatsApp).
export function Header({ config }: { config: ClientConfig }) {
  const { branding, meta, modules, contact } = config;
  const inmobiliaria = branding.layout === "inmobiliaria";
  // En el layout inmobiliaria, WhatsApp va como botón destacado en el header.
  const cta = inmobiliaria && contact.whatsapp ? buildWhatsAppLink(contact.whatsapp, contact.whatsappPrefilledMessage) : null;

  const links = [
    modules.propiedades && { href: "/propiedades", label: "Propiedades" },
    modules.agenda && { href: "/agenda", label: "Agendar" },
    modules.tienda && { href: "/tienda", label: "Tienda" },
    { href: "/#servicios", label: "Servicios" },
    inmobiliaria && config.team?.length ? { href: "/#equipo", label: "Equipo" } : { href: "/#nosotros", label: "Nosotros" },
    modules.pricing && { href: `/#${slugify(branding.pricingLabel)}`, label: branding.pricingLabel },
    { href: "/#contacto", label: "Contacto" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <HeaderClient
      logoUrl={branding.logoUrl}
      businessName={meta.businessName}
      logoIncludesName={branding.logoIncludesName}
      inmobiliaria={inmobiliaria}
      links={links}
      cta={cta}
    />
  );
}
