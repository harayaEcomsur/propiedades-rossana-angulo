import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, Bath, Ruler, Car, ArrowLeft } from "lucide-react";
import { clientConfig as baseConfig } from "@/config/client.config";
import { getSiteConfig } from "@/lib/site-content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { OPERATION_LABEL } from "@/components/properties/PropertyCard";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getPublicProperties } from "@/lib/public-properties";
import { videoEmbed } from "@/lib/video";
import { PropertyVideo } from "@/components/properties/PropertyVideo";
import { propertyJsonLd } from "@/lib/property-schema";
import { jsonLdString } from "@/lib/seo";
import { shortText } from "@/lib/text";
import { joinChannels, syndicationChannels } from "@/lib/syndication";

export const revalidate = 300;

// Las fichas existentes se generan en el build y las nuevas del panel a pedido
// (dynamicParams); todas quedan en caché y se renuevan cada 5 min o al
// guardar en el panel. Sin generateStaticParams, Next las renderizaba en cada
// visita (sin caché).
export async function generateStaticParams() {
  return (await getPublicProperties()).map((p) => ({ slug: p.slug }));
}

async function findProperty(slug: string) {
  return (await getPublicProperties()).find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const property = await findProperty(params.slug);
  if (!property) return {};
  // Título corto con lo que se busca (tipo + sector + operación + precio); la
  // marca solo si cabe en los ~60 caracteres que muestra Google.
  // En el título va solo el precio principal ("$670.000/mes", sin "+ GC").
  const mainPrice = property.price.split(/\s+\+|\s+\(/)[0];
  const base = `${property.title} | ${OPERATION_LABEL[property.operation]} ${mainPrice}`;
  const title = base.length <= 42 ? `${base} | Rossanna Angulo` : base;
  const specs = [
    property.bedrooms != null && `${property.bedrooms} dormitorios`,
    property.bathrooms != null && `${property.bathrooms} baños`,
    property.area != null && `${property.area} m²`,
  ].filter(Boolean);
  const description = shortText(
    `${OPERATION_LABEL[property.operation]} en ${property.comuna}, ${property.price}${specs.length ? ` · ${specs.join(", ")}` : ""}. ${property.description}`,
    158
  );
  const path = `/propiedades/${property.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      images: property.images.slice(0, 1).map((url) => ({ url, alt: property.title })),
    },
    twitter: { card: "summary_large_image", title, description, images: property.images.slice(0, 1) },
  };
}

export default async function PropiedadPage({ params }: { params: { slug: string } }) {
  const clientConfig = await getSiteConfig();
  const { modules, contact, syndication } = clientConfig;
  const property = await findProperty(params.slug);
  if (!modules.propiedades || !property) notFound();

  const hasWhatsapp = modules.whatsappButton && Boolean(contact.whatsapp);
  const video = property.video ? videoEmbed(property.video) : null;
  // Un video vertical va en la columna lateral, junto al botón de contacto.
  // Si además la única foto es la portada de ese mismo video (propiedades
  // tomadas de un reel), el video reemplaza a la galería en vez de repetirla.
  const sideVideo = video?.vertical ? video : null;
  const showGallery = !(sideVideo && property.images.length === 1);
  const waHref = contact.whatsapp
    ? buildWhatsAppLink(contact.whatsapp, `Hola! Me interesa la propiedad "${property.title}" (${property.comuna}) que vi en su sitio`)
    : "#contacto";
  const portals = syndicationChannels(syndication);

  const specs = [
    property.bedrooms != null && { icon: BedDouble, label: `${property.bedrooms} dormitorios` },
    property.bathrooms != null && { icon: Bath, label: `${property.bathrooms} baños` },
    property.area != null && { icon: Ruler, label: `${property.area} m²` },
    property.parking != null && property.parking > 0 && { icon: Car, label: `${property.parking} estac.` },
  ].filter(Boolean) as { icon: typeof BedDouble; label: string }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(propertyJsonLd(property)) }} />
      <Header config={clientConfig} />
      <main className="py-10 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link href="/propiedades" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-primary">
            <ArrowLeft size={15} /> Todas las propiedades
          </Link>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  {OPERATION_LABEL[property.operation]}
                </span>
                {property.exclusive && (
                  <span className="bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">En Exclusiva</span>
                )}
              </div>
              <h1 className="mt-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">{property.title}</h1>
              <p className="mt-1 text-sm font-medium uppercase tracking-wider text-foreground/60">{property.comuna}</p>
            </div>
            <p className="font-heading text-3xl font-bold text-primary">{property.price}</p>
          </div>

          {/* Galería */}
          {showGallery && (
            <div className={`mt-8 grid gap-3 ${property.images.length > 1 ? "sm:grid-cols-3" : ""}`}>
              <div className={`relative aspect-[4/3] overflow-hidden ${property.images.length > 1 ? "sm:col-span-2 sm:row-span-2" : "sm:aspect-[16/9]"}`}>
                <Image src={property.images[0]} alt={property.title} fill priority className="object-cover" />
              </div>
              {property.images.slice(1, 5).map((img, i) => (
                <div key={img} className="relative aspect-[4/3] overflow-hidden">
                  <Image src={img} alt={`${property.title} — foto ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Video horizontal: a todo el ancho, bajo la galería */}
          {video && !sideVideo && (
            <div className="mt-8">
              <h2 className="font-heading text-lg font-semibold text-foreground">Recorrido en video</h2>
              <div className="mt-3">
                <PropertyVideo video={video} title={property.title} />
              </div>
            </div>
          )}

          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {specs.length > 0 && (
                <div className="flex flex-wrap gap-6 border-y border-foreground/15 py-5">
                  {specs.map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-2 text-sm text-foreground/80">
                      <Icon size={17} className="text-primary" /> {label}
                    </span>
                  ))}
                </div>
              )}
              <h2 className="mt-6 font-heading text-lg font-semibold text-foreground">Descripción de la propiedad</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/80">{property.description}</p>
              {portals.length > 0 && (
                <p className="mt-6 text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Publicada también en {joinChannels(portals)}
                </p>
              )}
            </div>
            <div className={`flex flex-col gap-6 ${sideVideo ? "order-first lg:order-none" : ""}`}>
              {sideVideo && <PropertyVideo video={sideVideo} title={property.title} poster={property.images[0]} />}
              <aside className="h-fit border border-foreground/15 p-6">
                <p className="font-heading text-base font-semibold text-foreground">¿Te interesa esta propiedad?</p>
                <p className="mt-2 text-sm text-foreground/70">
                  Coordina una visita o pregunta lo que quieras — respondemos al tiro.
                </p>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:opacity-90"
                >
                  Consultar por WhatsApp
                </a>
              </aside>
            </div>
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
