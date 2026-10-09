import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { clientConfig as baseConfig } from "@/config/client.config";
import { getSiteConfig } from "@/lib/site-content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { PropertyExplorer } from "@/components/properties/PropertyExplorer";
import { getPublicProperties } from "@/lib/public-properties";
import { propertyListJsonLd } from "@/lib/property-schema";
import { jsonLdString } from "@/lib/seo";
import { joinChannels, syndicationChannels } from "@/lib/syndication";

export const revalidate = 300;

const title = "Propiedades en venta y arriendo en Viña del Mar y Concón";
const description =
  "Casas y departamentos en venta y arriendo en Viña del Mar, Reñaca, Concón y Santiago. Filtra por comuna, tipo y dormitorios y consulta por WhatsApp.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/propiedades" },
  openGraph: {
    title,
    description,
    url: "/propiedades",
    type: "website",
    images: baseConfig.seo.ogImageUrl ? [{ url: baseConfig.seo.ogImageUrl, width: 1200, height: 630 }] : undefined,
  },
};

export default async function PropiedadesPage() {
  const clientConfig = await getSiteConfig();
  const { modules, contact, syndication } = clientConfig;
  const properties = await getPublicProperties();
  if (!modules.propiedades || !properties.length) notFound();
  const hasWhatsapp = modules.whatsappButton && Boolean(contact.whatsapp);
  const portals = syndicationChannels(syndication);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(propertyListJsonLd(properties)) }} />
      <Header config={clientConfig} />
      <main className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--color-primary)_85%,black)]">Propiedades</p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Encuentra tu próxima propiedad
          </h1>
          {portals.length > 0 && (
            <p className="mt-3 max-w-2xl text-sm text-foreground/60">
              Publicamos cada propiedad también en {joinChannels(portals)}, para que llegue a más
              personas.
            </p>
          )}
          <div className="mt-10">
            <PropertyExplorer properties={properties} />
          </div>
        </div>
      </main>
      <Footer config={clientConfig} />
      {hasWhatsapp && contact.whatsapp ? (
        <WhatsAppButton phone={contact.whatsapp} message={contact.whatsappPrefilledMessage} />
      ) : null}
      {modules.chat ? <ChatWidget businessName={clientConfig.meta.businessName} stacked={hasWhatsapp} /> : null}
    </>
  );
}
