import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/site-content";
import { TestimonialForm } from "@/components/testimonials/TestimonialForm";

// Página para que clientes dejen su testimonio. No se enlaza desde el sitio
// ni se indexa: se comparte a clientes por link o QR (panel → Testimonios).
export const metadata: Metadata = {
  title: "Deja tu testimonio",
  robots: { index: false, follow: false },
};

export default async function OpinaPage() {
  const site = await getSiteConfig();
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        {site.branding.logoUrl && (
          <div className="mx-auto h-20 w-44 overflow-hidden rounded-xl bg-white shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.branding.logoUrl} alt={site.meta.businessName} className="h-full w-full object-cover" />
          </div>
        )}
        <h1 className="mt-8 text-center font-heading text-3xl font-bold text-foreground">Cuéntanos tu experiencia</h1>
        <p className="mb-8 mt-3 text-center text-foreground/70">
          Tu opinión ayuda a otras familias a elegir con confianza. Toma menos de un minuto.
        </p>
        <TestimonialForm businessName={site.meta.businessName} />
      </div>
    </main>
  );
}
