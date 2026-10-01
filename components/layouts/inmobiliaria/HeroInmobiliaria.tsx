import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import type { ClientConfig } from "@/config/schema";

// Hero estilo corretaje premium (ref: Property Partners, Engel & Völkers):
// imagen full-screen como protagonista, degradado oscuro abajo, eyebrow en
// mayúsculas con tracking amplio y titular serif grande alineado a la izquierda.
export function HeroInmobiliaria({
  hero,
  rubro,
  hasGallery,
  logoUrl,
  businessName,
}: {
  hero: ClientConfig["hero"];
  rubro: string;
  hasGallery: boolean;
  logoUrl?: string;
  businessName: string;
}) {
  return (
    <section className="relative flex min-h-[82vh] items-end overflow-hidden">
      {hero.backgroundImageUrl ? (
        <Image src={hero.backgroundImageUrl} alt="" fill priority className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-primary/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-40 sm:px-6 sm:pb-24">
        {/* El logo viene sobre fondo blanco (JPG): va en una placa blanca que
            recorta el margen vacío del cuadrado original. */}
        {logoUrl && (
          <div className="relative mb-6 h-20 w-44 overflow-hidden rounded-xl bg-white shadow-lg sm:h-24 sm:w-52">
            <Image src={logoUrl} alt={businessName} fill sizes="208px" className="object-cover" />
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">{rubro}</p>
        <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-6xl">
          {hero.title}
        </h1>
        {hero.subtitle && <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{hero.subtitle}</p>}
        {hero.badges && hero.badges.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-3">
            {hero.badges.map((badge) => (
              <li
                key={badge}
                className="inline-flex items-center gap-2 border border-white/30 bg-black/30 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-sm"
              >
                <ShieldCheck size={16} className="shrink-0 text-white" aria-hidden />
                {badge}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={hero.ctaHref}
            className="inline-flex items-center bg-primary px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:opacity-90"
          >
            {hero.ctaLabel}
          </a>
          {hasGallery && (
            <a
              href="#propiedades"
              className="inline-flex items-center border border-white/60 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
            >
              Ver propiedades
            </a>
          )}
        </div>
      </div>
      {hero.backgroundImageCredit && (
        <a
          href={hero.backgroundImageCredit.href}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-3 text-[10px] text-white/60 hover:text-white"
        >
          {hero.backgroundImageCredit.text}
        </a>
      )}
    </section>
  );
}
