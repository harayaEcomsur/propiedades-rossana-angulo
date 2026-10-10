import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSiteConfig } from "@/lib/site-content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { GUIDES, getGuide } from "@/lib/guides";
import { absoluteUrl, jsonLdString, organizationId } from "@/lib/seo";

export const revalidate = 3600;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGuide(params.slug);
  if (!g) return {};
  const path = `/guias/${g.slug}`;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: path },
    openGraph: { title: g.title, description: g.description, url: path, type: "article", modifiedTime: g.updated },
  };
}

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

export default async function GuidePage({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  if (!g) notFound();
  const site = await getSiteConfig();
  const { modules, contact } = site;
  const hasWhatsapp = modules.whatsappButton && Boolean(contact.whatsapp);
  const founder = site.seo.founder;
  const path = `/guias/${g.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: g.title,
        description: g.description,
        dateModified: g.updated,
        mainEntityOfPage: absoluteUrl(path),
        inLanguage: "es-CL",
        author: founder ? { "@type": "Person", name: founder, jobTitle: site.seo.founderJobTitle } : { "@id": organizationId() },
        publisher: { "@id": organizationId() },
        citation: g.sources.map((s) => s.url),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Guías", item: absoluteUrl("/guias") },
          { "@type": "ListItem", position: 3, name: g.title, item: absoluteUrl(path) },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <Header config={site} />
      <main className="py-14 sm:py-20">
        <article className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link href="/guias" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-primary">
            <ArrowLeft size={15} /> Guías
          </Link>
          <h1 className="mt-6 font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl">{g.title}</h1>
          <p className="mt-3 text-sm text-foreground/60">
            {founder ? `Por ${founder} · ` : ""}Actualizada el {formatDate(g.updated)}
          </p>
          <p className="mt-6 text-lg leading-relaxed text-foreground/80">{g.intro}</p>
          {g.sections.map((s) => (
            <section key={s.heading} className="mt-10">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p.slice(0, 40)} className="mt-3 leading-relaxed text-foreground/75">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-foreground/75">
                  {s.list.map((li) => (
                    <li key={li.slice(0, 40)}>{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <section className="mt-12 border-t border-foreground/10 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">Fuentes</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {g.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-foreground/50">
              Esta guía es informativa y no reemplaza la asesoría de un abogado para tu caso.
            </p>
          </section>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/propiedades" className="bg-primary px-5 py-3 text-sm font-semibold text-white">
              Ver propiedades
            </Link>
            <Link href="/#contacto" className="border border-foreground/20 px-5 py-3 text-sm font-semibold text-foreground">
              Hablar con nosotros
            </Link>
          </div>
        </article>
      </main>
      <Footer config={site} />
      {hasWhatsapp && contact.whatsapp ? <WhatsAppButton phone={contact.whatsapp} message={contact.whatsappPrefilledMessage} /> : null}
      {modules.chat ? <ChatWidget businessName={site.meta.businessName} stacked={hasWhatsapp} /> : null}
    </>
  );
}
