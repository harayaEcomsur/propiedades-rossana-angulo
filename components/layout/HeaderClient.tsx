"use client";

import { useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import { Container } from "@/components/ui/Container";

// Parte interactiva del encabezado (menú móvil). Recibe solo lo que dibuja:
// pasarle el config completo lo serializaba entero en cada página.
export interface HeaderProps {
  logoUrl?: string;
  businessName: string;
  logoIncludesName: boolean;
  inmobiliaria: boolean;
  links: { href: string; label: string }[];
  cta: string | null;
}

export function HeaderClient({ logoUrl, businessName, logoIncludesName, inmobiliaria, links, cta }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const branding = { logoUrl, logoIncludesName };
  const meta = { businessName };

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-background/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between sm:h-24">
        {/* El logo es la marca del cliente: va grande (2-3x el título), y el
            nombre en texto pasa a acompañarlo en chico. */}
        <a href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo is a local SVG; next/image requires dangerouslyAllowSVG for those */}
          {inmobiliaria ? (
            // Logo cuadrado con margen blanco: se recorta a una placa apaisada
            // para que el nombre se lea (mismo tratamiento que el hero).
            <span className="block h-12 w-28 overflow-hidden rounded-md bg-white sm:h-16 sm:w-40">
              <img src={branding.logoUrl} alt={meta.businessName} className="h-full w-full object-cover" />
            </span>
          ) : (
            <img
              src={branding.logoUrl}
              alt={meta.businessName}
              className="h-12 w-auto max-w-[170px] rounded-md object-contain sm:h-[4.5rem] sm:max-w-[280px]"
            />
          )}
          {/* En móvil el nombre siempre acompaña al logo (el logo se achica y
              puede no leerse); en desktop se omite solo si el logo ya lo trae. */}
          <span
            className={`truncate font-heading text-sm font-medium text-foreground/80 ${
              branding.logoIncludesName ? "md:hidden" : ""
            }`}
          >
            {meta.businessName}
          </span>
        </a>
        <div className="hidden items-center gap-8 sm:flex">
          <nav className="flex gap-6 text-sm font-medium text-foreground/70">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-primary">
                {link.label}
              </a>
            ))}
          </nav>
          {cta && (
            <a
              href={cta}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-11 items-center gap-2 bg-primary px-5 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 lg:inline-flex"
            >
              <MessageCircle size={16} aria-hidden /> Escríbenos
            </a>
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="-m-2 p-2 text-foreground sm:hidden"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </Container>
      {open && (
        <nav className="border-t border-black/5 bg-background sm:hidden">
          <Container className="flex flex-col py-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-black/5 py-3.5 text-base font-medium text-foreground/80 last:border-b-0 hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
