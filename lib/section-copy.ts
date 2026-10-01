import type { ClientConfig } from "@/config/schema";

// Textos por defecto de los encabezados de la home y del menú. El config
// (`sections`, `nav`) y lo editado en el panel se superponen campo a campo.
export const DEFAULT_SECTIONS = {
  properties: {
    eyebrow: "Propiedades",
    title: "Propiedades destacadas",
    subtitle: "Casas y departamentos en venta y arriendo, con fotos, video y todos los datos para decidir.",
    cta: "Ver todas",
  },
  exclusive: {
    eyebrow: "Solo con nosotros",
    title: "En Exclusiva",
    subtitle: "Conoce propiedades que solo encontrarás aquí",
    cta: "Ver exclusivas",
  },
  services: { eyebrow: "Servicios", title: "Un servicio integral, de la tasación a la entrega de llaves" },
  about: { eyebrow: "Nosotros" },
  team: {
    eyebrow: "Equipo",
    title: "Nuestros asesores",
    subtitle: "Un equipo que te acompaña de la primera visita a la inscripción de tu propiedad. Escríbele directo a quien prefieras.",
  },
  testimonials: { eyebrow: "Testimonios", title: "Lo que dicen nuestros clientes" },
  instagram: { eyebrow: "Instagram", title: "Síguenos en Instagram", subtitle: "" },
  pricing: { eyebrow: "", title: "Honorarios claros, sin letra chica", subtitle: "La comisión se paga solo si el negocio se concreta." },
  faq: { eyebrow: "Preguntas frecuentes", title: "Lo que más nos preguntan", cta: "¿Otra duda? Escríbenos" },
  contact: {
    eyebrow: "Contacto",
    title: "Conversemos sobre tu propiedad",
    subtitle: "Cuéntanos qué buscas, o qué propiedad quieres vender o arrendar, y te asesoramos.",
    formTitle: "Escríbenos",
    formSubtitle: "Déjanos tus datos y te contactamos.",
  },
};

export const DEFAULT_NAV = {
  properties: "Propiedades",
  services: "Servicios",
  team: "Equipo",
  pricing: "",
  contact: "Contacto",
  cta: "Escríbenos",
};

export type SectionCopy = typeof DEFAULT_SECTIONS;
export type NavCopy = typeof DEFAULT_NAV;

// Campos que se pueden dejar en blanco a propósito (antetítulos y bajadas):
// un "" guardado significa "no mostrar". Títulos y botones, en cambio, vuelven
// al texto por defecto si quedan vacíos (una sección nunca queda sin título ni
// un botón sin texto).
const BLANKABLE = new Set(["eyebrow", "subtitle", "formSubtitle"]);

function merge<T extends Record<string, string>>(base: T, over?: Partial<Record<keyof T, string | undefined>>): T {
  const out = { ...base };
  for (const [k, v] of Object.entries(over ?? {})) {
    if (typeof v !== "string") continue;
    if (v.trim() || BLANKABLE.has(k)) (out as Record<string, string>)[k] = v.trim();
  }
  return out;
}

export function resolveSections(config: ClientConfig): SectionCopy {
  const s = config.sections ?? {};
  const pricingLabel = config.branding.pricingLabel;
  return {
    properties: merge(DEFAULT_SECTIONS.properties, s.properties),
    exclusive: merge(DEFAULT_SECTIONS.exclusive, s.exclusive),
    services: merge(DEFAULT_SECTIONS.services, s.services),
    about: merge(DEFAULT_SECTIONS.about, s.about),
    team: merge(DEFAULT_SECTIONS.team, s.team),
    testimonials: merge(DEFAULT_SECTIONS.testimonials, s.testimonials),
    instagram: merge(DEFAULT_SECTIONS.instagram, s.instagram),
    pricing: merge({ ...DEFAULT_SECTIONS.pricing, eyebrow: pricingLabel }, s.pricing),
    faq: merge(DEFAULT_SECTIONS.faq, s.faq),
    contact: merge(DEFAULT_SECTIONS.contact, s.contact),
  };
}

export function resolveNav(config: ClientConfig): NavCopy {
  return merge({ ...DEFAULT_NAV, pricing: config.branding.pricingLabel }, config.nav);
}
