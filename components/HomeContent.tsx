import { getSiteConfig } from "@/lib/site-content";
import { resolveSections } from "@/lib/section-copy";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { About } from "@/components/sections/About";
import { Gallery } from "@/components/sections/Gallery";
import { HeroInmobiliaria } from "@/components/layouts/inmobiliaria/HeroInmobiliaria";
import { ServicesInmobiliaria } from "@/components/layouts/inmobiliaria/ServicesInmobiliaria";
import { GalleryInmobiliaria } from "@/components/layouts/inmobiliaria/GalleryInmobiliaria";
import { HeroCorporativo } from "@/components/layouts/corporativo/HeroCorporativo";
import { FeaturedProperties } from "@/components/properties/FeaturedProperties";
import { ServicesCorporativo } from "@/components/layouts/corporativo/ServicesCorporativo";
import { Testimonials } from "@/components/sections/Testimonials";
import { InstagramFeed } from "@/components/social/InstagramFeed";
import { FAQ } from "@/components/sections/FAQ";
import { Pricing } from "@/components/sections/Pricing";
import { ContactForm } from "@/components/sections/ContactForm";
import { MapEmbed } from "@/components/sections/MapEmbed";
import { Container } from "@/components/ui/Container";
import { PillarsInmobiliaria } from "@/components/layouts/inmobiliaria/PillarsInmobiliaria";
import { ExclusiveInmobiliaria } from "@/components/layouts/inmobiliaria/ExclusiveInmobiliaria";
import { AboutInmobiliaria } from "@/components/layouts/inmobiliaria/AboutInmobiliaria";
import { TeamInmobiliaria } from "@/components/layouts/inmobiliaria/TeamInmobiliaria";
import { TestimonialsInmobiliaria } from "@/components/layouts/inmobiliaria/TestimonialsInmobiliaria";
import { PricingInmobiliaria } from "@/components/layouts/inmobiliaria/PricingInmobiliaria";
import { FAQInmobiliaria } from "@/components/layouts/inmobiliaria/FAQInmobiliaria";
import { ContactInmobiliaria } from "@/components/layouts/inmobiliaria/ContactInmobiliaria";
import { getServicePrices } from "@/lib/booking-store";
import { getPublicProperties } from "@/lib/public-properties";

export async function HomeContent() {
  // Config con los textos e imágenes editados en el panel (pestaña "Sitio").
  const clientConfig = await getSiteConfig();
  // Títulos y textos de cada sección (editables en el panel → Sitio → Títulos y menú).
  const copy = resolveSections(clientConfig);
  const { modules, contact, branding, meta } = clientConfig;
  const hasWhatsapp = modules.whatsappButton && Boolean(contact.whatsapp);
  const layout = branding.layout;
  const gallery = clientConfig.gallery ?? [];
  const instagramUrl = contact.socials?.find((s) => s.platform === "instagram")?.url;

  // El precio que el dueño haya guardado desde el panel de agenda manda sobre
  // el del config — mismo mecanismo que la duración de cada servicio.
  const priceOverrides = await getServicePrices();
  const servicesData = clientConfig.services.map((s) => ({ ...s, price: priceOverrides[s.title] ?? s.price }));

  // Cada layout intercambia hero, servicios y galería para que dos clientes de
  // rubros distintos no se vean como el mismo sitio con otra paleta. El resto
  // de las secciones (nosotros, testimonios, precios, FAQ, contacto) es común.
  const hero =
    layout === "inmobiliaria" ? (
      <HeroInmobiliaria
        hero={clientConfig.hero}
        rubro={meta.rubro}
        hasGallery={gallery.length > 0}
        logoUrl={branding.logoUrl}
        businessName={meta.businessName}
      />
    ) : layout === "corporativo" ? (
      <HeroCorporativo hero={clientConfig.hero} rubro={meta.rubro} />
    ) : (
      <Hero hero={clientConfig.hero} />
    );

  const services =
    layout === "inmobiliaria" ? (
      <ServicesInmobiliaria services={servicesData} copy={copy.services} />
    ) : layout === "corporativo" ? (
      <ServicesCorporativo services={servicesData} />
    ) : (
      <Services services={servicesData} />
    );

  // Con el módulo de propiedades activo, el inventario real reemplaza a la galería.
  const properties = await getPublicProperties();
  const gallerySection = properties.length > 0 ? (
    <FeaturedProperties properties={properties} copy={copy.properties} />
  ) : !gallery.length ? null : layout === "inmobiliaria" ? (
    <GalleryInmobiliaria images={gallery} />
  ) : (
    <Gallery images={gallery} />
  );

  const floating = (
    <>
      {hasWhatsapp && contact.whatsapp ? (
        <WhatsAppButton phone={contact.whatsapp} message={contact.whatsappPrefilledMessage} />
      ) : null}
      {modules.chat ? <ChatWidget businessName={clientConfig.meta.businessName} stacked={hasWhatsapp} /> : null}
    </>
  );

  // Layout inmobiliaria: rediseño propio de la home completa (refs: Property
  // Partners para "En Exclusiva", Maktub para el equipo). El orden cuenta una
  // historia: quiénes somos → qué tenemos → qué hacemos → quiénes te atienden
  // → prueba social → precios → dudas → contacto.
  if (layout === "inmobiliaria") {
    return (
      <>
        <Header config={clientConfig} />
        <main>
          {hero}
          {clientConfig.pillars?.length ? <PillarsInmobiliaria pillars={clientConfig.pillars} /> : null}
          {gallerySection}
          <ExclusiveInmobiliaria properties={properties} copy={copy.exclusive} />
          {services}
          <AboutInmobiliaria about={clientConfig.about} copy={copy.about} />
          {clientConfig.team?.length ? <TeamInmobiliaria team={clientConfig.team} copy={copy.team} /> : null}
          {modules.testimonials && clientConfig.testimonials?.length ? (
            <TestimonialsInmobiliaria testimonials={clientConfig.testimonials} copy={copy.testimonials} />
          ) : null}
          {instagramUrl ? (
            <InstagramFeed
              instagramUrl={instagramUrl}
              businessName={meta.businessName}
              variant="carousel"
              heading={{ eyebrow: copy.instagram.eyebrow, title: copy.instagram.title }}
              tagline={copy.instagram.subtitle || "Propiedades nuevas, ventas y arriendos en @propiedadesrossanna."}
            />
          ) : null}
          {modules.pricing && clientConfig.pricing?.length ? <PricingInmobiliaria plans={clientConfig.pricing} label={branding.pricingLabel} copy={copy.pricing} /> : null}
          {modules.faq && clientConfig.faq?.length ? <FAQInmobiliaria items={clientConfig.faq} whatsapp={contact.whatsapp} copy={copy.faq} /> : null}
          <ContactInmobiliaria contact={contact} showForm={modules.contactForm} copy={copy.contact} />
        </main>
        <Footer config={clientConfig} />
        {floating}
      </>
    );
  }

  return (
    <>
      <Header config={clientConfig} />
      <main>
        {hero}
        {services}
        <About about={clientConfig.about} />
        {gallerySection}
        {modules.testimonials && clientConfig.testimonials?.length ? (
          <Testimonials testimonials={clientConfig.testimonials} />
        ) : null}
        {instagramUrl ? <InstagramFeed instagramUrl={instagramUrl} businessName={meta.businessName} /> : null}
        {modules.pricing && clientConfig.pricing?.length ? <Pricing plans={clientConfig.pricing} label={branding.pricingLabel} /> : null}
        {modules.faq && clientConfig.faq?.length ? <FAQ items={clientConfig.faq} /> : null}
        <section id="contacto" className="py-16 sm:py-24">
          <Container className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <h2 className="font-heading text-3xl font-bold text-foreground">Contacto</h2>
              {contact.address && <MapEmbed query={contact.mapQuery ?? contact.address} />}
            </div>
            {modules.contactForm ? <ContactForm /> : null}
          </Container>
        </section>
      </main>
      <Footer config={clientConfig} />
      {hasWhatsapp && contact.whatsapp ? (
        <WhatsAppButton phone={contact.whatsapp} message={contact.whatsappPrefilledMessage} />
      ) : null}
      {modules.chat ? (
        <ChatWidget businessName={clientConfig.meta.businessName} stacked={hasWhatsapp} />
      ) : null}
    </>
  );
}
