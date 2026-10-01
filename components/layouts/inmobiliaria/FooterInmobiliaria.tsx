import { Instagram, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { slugify } from "@/lib/text";
import type { ClientConfig } from "@/config/schema";
import { HarayaDevCredit } from "@/components/brand/HarayaDevCredit";

// Pie oscuro (mismo negro de "En Exclusiva") con el logo en placa blanca, como
// en el hero.
export function FooterInmobiliaria({ config, showCredit }: { config: ClientConfig; showCredit: boolean }) {
  const { meta, contact, branding, modules, seo } = config;
  const instagram = contact.socials?.find((s) => s.platform === "instagram")?.url;
  const links = [
    modules.propiedades && { href: "/propiedades", label: "Propiedades" },
    { href: "/#servicios", label: "Servicios" },
    { href: "/#equipo", label: "Equipo" },
    modules.pricing && { href: `/#${slugify(branding.pricingLabel)}`, label: branding.pricingLabel },
    modules.faq && { href: "/#preguntas-frecuentes", label: "Preguntas frecuentes" },
    { href: "/#contacto", label: "Contacto" },
  ].filter(Boolean) as { href: string; label: string }[];

  const linkCls = "text-white/70 transition-colors hover:text-white";

  return (
    <footer className="bg-accent text-sm text-white">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          {branding.logoUrl && (
            // El logo es un cuadrado con mucho margen blanco: la placa lo recorta
            // (object-cover) para que se lea, igual que en el hero.
            <div className="relative h-24 w-52 overflow-hidden rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branding.logoUrl} alt={meta.businessName} className="h-full w-full object-cover" />
            </div>
          )}
          <p className="mt-6 max-w-sm leading-relaxed text-white/70">{seo.description}</p>
        </div>
        <nav aria-label="Pie de página">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Navegación</p>
          <ul className="mt-4 space-y-2.5">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={linkCls}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Contacto</p>
          <ul className="mt-4 space-y-2.5">
            {contact.whatsapp && (
              <li>
                <a href={buildWhatsAppLink(contact.whatsapp, contact.whatsappPrefilledMessage)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 ${linkCls}`}>
                  <MessageCircle size={15} aria-hidden /> WhatsApp
                </a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className={`inline-flex items-center gap-2 ${linkCls}`}>
                  <Phone size={15} aria-hidden /> {contact.phone}
                </a>
              </li>
            )}
            {instagram && (
              <li>
                <a href={instagram} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 ${linkCls}`}>
                  <Instagram size={15} aria-hidden /> Instagram
                </a>
              </li>
            )}
            {contact.address && <li className="text-white/70">{contact.address}</li>}
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {meta.businessName}. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="/privacidad" className="hover:text-white">
              Política de privacidad
            </a>
            {showCredit && <HarayaDevCredit tone="dark" />}
          </div>
        </Container>
      </div>
    </footer>
  );
}
