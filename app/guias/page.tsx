import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/lib/site-content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { GUIDES } from "@/lib/guides";

const title = "Guías para comprar, vender y arrendar";
const description = "Guías prácticas con fuentes oficiales: gastos al comprar una propiedad en Chile y cómo arrendar tu casa o departamento con seguridad.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guias" },
  openGraph: { title, description, url: "/guias", type: "website" },
};

export default async function GuiasPage() {
  const site = await getSiteConfig();
  const { modules, contact } = site;
  const hasWhatsapp = modules.whatsappButton && Boolean(contact.whatsapp);
  return (
    <>
      <Header config={site} />
      <main className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--color-primary)_85%,black)]">Guías</p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
          <ul className="mt-10 flex flex-col gap-6">
            {GUIDES.map((g) => (
              <li key={g.slug} className="border border-foreground/10 p-5">
                <Link href={`/guias/${g.slug}`} className="font-heading text-xl font-semibold text-foreground hover:text-primary">
                  {g.title}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{g.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer config={site} />
      {hasWhatsapp && contact.whatsapp ? <WhatsAppButton phone={contact.whatsapp} message={contact.whatsappPrefilledMessage} /> : null}
      {modules.chat ? <ChatWidget businessName={site.meta.businessName} stacked={hasWhatsapp} /> : null}
    </>
  );
}
