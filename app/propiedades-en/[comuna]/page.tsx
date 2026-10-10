import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSiteConfig } from "@/lib/site-content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { PropertyExplorer } from "@/components/properties/PropertyExplorer";
import { getComunaPages } from "@/lib/comuna-pages";
import { propertyListJsonLd } from "@/lib/property-schema";
import { jsonLdString } from "@/lib/seo";

// Página por comuna: texto propio de la comuna + sus propiedades (venta y
// arriendo). Solo existe si la comuna tiene suficientes propiedades.
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getComunaPages()).map((c) => ({ comuna: c.slug }));
}

async function find(slug: string) {
  return (await getComunaPages()).find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: { params: { comuna: string } }): Promise<Metadata> {
  const c = await find(params.comuna);
  if (!c) return {};
  const ventas = c.properties.filter((p) => p.operation === "venta").length;
  const arriendos = c.properties.length - ventas;
  const title = `Propiedades en venta y arriendo en ${c.name}`;
  const description = `${c.properties.length} casas y departamentos en ${c.name}: ${ventas} en venta y ${arriendos} en arriendo. Asesoría personal, tasación por arquitecto y asesoría legal hasta la inscripción.`;
  const path = `/propiedades-en/${c.slug}`;
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, type: "website" } };
}

export default async function ComunaPage({ params }: { params: { comuna: string } }) {
  const c = await find(params.comuna);
  if (!c) notFound();
  const site = await getSiteConfig();
  const { modules, contact } = site;
  const hasWhatsapp = modules.whatsappButton && Boolean(contact.whatsapp);
  const ventas = c.properties.filter((p) => p.operation === "venta").length;

  const jsonLd = propertyListJsonLd(c.properties, { name: c.name, path: `/propiedades-en/${c.slug}` });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <Header config={site} />
      <main className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link href="/propiedades" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-primary">
            <ArrowLeft size={15} /> Todas las propiedades
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--color-primary)_85%,black)]">{c.name}</p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">Propiedades en venta y arriendo en {c.name}</h1>
          <p className="mt-4 max-w-3xl leading-relaxed text-foreground/75">{c.intro}</p>
          <p className="mt-3 text-sm text-foreground/60">
            Hoy tenemos {c.properties.length} propiedades en {c.name}: {ventas} en venta y {c.properties.length - ventas} en arriendo.
          </p>
          {c.sectors && c.sectors.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Sectores de ${c.name}`}>
              {c.sectors.map((s) => (
                <li key={s} className="border border-foreground/15 px-3 py-1 text-xs text-foreground/70">
                  {s}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-10">
            <PropertyExplorer properties={c.properties} />
          </div>
        </div>
      </main>
      <Footer config={site} />
      {hasWhatsapp && contact.whatsapp ? <WhatsAppButton phone={contact.whatsapp} message={contact.whatsappPrefilledMessage} /> : null}
      {modules.chat ? <ChatWidget businessName={site.meta.businessName} stacked={hasWhatsapp} /> : null}
    </>
  );
}
