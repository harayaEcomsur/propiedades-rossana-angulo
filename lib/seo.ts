import type { Metadata } from "next";
import type { ClientConfig } from "@/config/schema";

// URL pública canónica del sitio (sin "/" final). Todo lo que Google o una IA
// ven como dirección oficial — canonical, sitemap, robots.txt, Open Graph,
// JSON-LD, llms.txt — sale de acá, así que en producción NEXT_PUBLIC_SITE_URL
// debe ser el dominio propio (no el *.vercel.app).
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildMetadata(config: ClientConfig): Metadata {
  const base = getSiteUrl();
  const ogImages = config.seo.ogImageUrl
    ? [{ url: config.seo.ogImageUrl, width: 1200, height: 630, alt: config.meta.businessName }]
    : undefined;
  return {
    metadataBase: new URL(base),
    title: config.seo.title,
    description: config.seo.description,
    keywords: config.seo.keywords,
    // Cada página declara su propia canonical (relativa a metadataBase); esta es
    // la de la home. Evita que el dominio *.vercel.app compita con el propio.
    alternates: { canonical: "/" },
    // SITE_NOINDEX se define solo en el proyecto Vercel de la demo (datos ficticios):
    // evita indexar un negocio falso con schema LocalBusiness. Los proyectos de
    // clientes reales no llevan esta env var y se indexan normalmente.
    robots: process.env.SITE_NOINDEX
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    // Firma técnica: invisible para el visitante, pero la leen las herramientas
    // de detección de stack (BuiltWith, Wappalyzer) y quien inspeccione el HTML.
    generator: "HarayaDev — haraya.dev",
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      url: "/",
      siteName: config.meta.businessName,
      locale: config.meta.locale.replace("-", "_"),
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: config.seo.title,
      description: config.seo.description,
      images: config.seo.ogImageUrl ? [config.seo.ogImageUrl] : undefined,
    },
    icons: config.branding.faviconUrl ? { icon: config.branding.faviconUrl, apple: config.branding.faviconUrl } : undefined,
  };
}

// "Lunes a viernes" / "Sábado" / "Lunes, miércoles" → días de schema.org.
const DAYS: Array<[RegExp, string]> = [
  [/lunes/i, "Monday"],
  [/martes/i, "Tuesday"],
  [/mi[eé]rcoles/i, "Wednesday"],
  [/jueves/i, "Thursday"],
  [/viernes/i, "Friday"],
  [/s[aá]bado/i, "Saturday"],
  [/domingo/i, "Sunday"],
];

function schemaDays(label: string): string[] {
  const found = DAYS.filter(([re]) => re.test(label)).map(([, d]) => d);
  const range = label.match(/(\p{L}+)\s+a\s+(\p{L}+)/u);
  if (range) {
    const order = DAYS.map(([, d]) => d);
    const from = DAYS.find(([re]) => re.test(range[1]))?.[1];
    const to = DAYS.find(([re]) => re.test(range[2]))?.[1];
    if (from && to) return order.slice(order.indexOf(from), order.indexOf(to) + 1);
  }
  return found;
}

// Entidad del negocio (RealEstateAgent, LocalBusiness, etc.). Tiene @id fijo
// para que las demás piezas de JSON-LD (fichas, FAQ, sitio) la referencien como
// una sola entidad — así Google y las IAs la reconocen como el mismo negocio.
export function organizationId(): string {
  return `${getSiteUrl()}/#organization`;
}

export function buildLocalBusinessJsonLd(config: ClientConfig) {
  const base = getSiteUrl();
  const { seo, contact, meta, branding } = config;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": seo.businessType,
        "@id": organizationId(),
        name: meta.businessName,
        url: `${base}/`,
        description: seo.description,
        logo: branding.logoUrl ? absoluteUrl(branding.logoUrl) : undefined,
        image: seo.ogImageUrl ? absoluteUrl(seo.ogImageUrl) : branding.logoUrl ? absoluteUrl(branding.logoUrl) : undefined,
        telephone: contact.phone,
        email: contact.email,
        founder: seo.founder ? { "@type": "Person", name: seo.founder, jobTitle: seo.founderJobTitle } : undefined,
        address: seo.postalAddress
          ? { "@type": "PostalAddress", ...seo.postalAddress }
          : contact.address
            ? { "@type": "PostalAddress", streetAddress: contact.address }
            : undefined,
        areaServed: seo.areaServed?.map((name) => ({ "@type": "Place", name })),
        knowsAbout: seo.knowsAbout,
        priceRange: seo.priceRange,
        sameAs: contact.socials?.map((s) => s.url),
        openingHoursSpecification: contact.hours
          ?.filter((h) => !h.closed && h.open && h.close)
          .map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: schemaDays(h.day),
            opens: h.open,
            closes: h.close,
          })),
        contactPoint: contact.phone
          ? {
              "@type": "ContactPoint",
              telephone: contact.phone,
              contactType: "customer service",
              areaServed: "CL",
              availableLanguage: ["es"],
            }
          : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: `${base}/`,
        name: meta.businessName,
        inLanguage: meta.locale,
        publisher: { "@id": organizationId() },
      },
    ],
  };
}

// Serializa JSON-LD para un <script>: escapa "<" para que un texto con
// "</script>" no pueda cerrar la etiqueta.
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
