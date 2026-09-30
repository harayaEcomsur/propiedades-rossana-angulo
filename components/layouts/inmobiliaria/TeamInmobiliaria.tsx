import Image from "next/image";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { ClientConfig } from "@/config/schema";

type Member = NonNullable<ClientConfig["team"]>[number];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

// "Nuestros asesores" (ref: Maktub, "Nuestros Profesionales"): foto circular,
// nombre, cargo y contacto directo con cada asesor. Sin foto, monograma con
// las iniciales en los colores de la marca.
export function TeamInmobiliaria({ team }: { team: Member[] }) {
  if (!team.length) return null;
  const single = team.length === 1;

  return (
    <section id="equipo" aria-labelledby="equipo-titulo" className="bg-foreground/[0.03] py-20 sm:py-28">
      <Container>
        <SectionHeading
          id="equipo-titulo"
          eyebrow="Equipo"
          title="Nuestros asesores"
          subtitle="Un equipo que te acompaña de la primera visita a la inscripción de tu propiedad. Escríbele directo a quien prefieras."
          align="center"
        />
        <ul className={`mt-14 grid gap-8 ${single ? "mx-auto max-w-sm" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
          {team.map((m, i) => (
            <li key={m.name}>
              <Reveal delay={(i % 4) * 80} className="flex h-full flex-col items-center bg-background px-6 pb-7 pt-9 text-center shadow-[0_8px_30px_-14px_rgba(0,0,0,0.25)]">
                <div className="relative h-32 w-32 overflow-hidden rounded-full ring-2 ring-primary ring-offset-4 ring-offset-background">
                  {m.photoUrl ? (
                    <Image src={m.photoUrl} alt={`Foto de ${m.name}`} fill sizes="128px" className="object-cover" />
                  ) : (
                    <div aria-hidden className="flex h-full w-full items-center justify-center bg-accent font-heading text-4xl font-semibold tracking-wide text-white">
                      {initials(m.name)}
                    </div>
                  )}
                </div>
                <h3 className="mt-6 font-heading text-xl font-semibold text-foreground">{m.name}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary">{m.role}</p>
                {m.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/65">{m.bio}</p>}
                <div className="mt-auto flex w-full flex-wrap justify-center gap-2 pt-6">
                  {m.whatsapp && (
                    <a
                      href={buildWhatsAppLink(m.whatsapp, `Hola ${m.name.split(" ")[0]}! Vi el sitio web y quiero hacer una consulta`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      <MessageCircle size={16} aria-hidden /> WhatsApp
                    </a>
                  )}
                  {m.phone && (
                    <a
                      href={`tel:${m.phone.replace(/\s/g, "")}`}
                      aria-label={`Llamar a ${m.name}`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center border border-foreground/20 text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Phone size={16} aria-hidden />
                    </a>
                  )}
                  {m.email && (
                    <a
                      href={`mailto:${m.email}`}
                      aria-label={`Escribir un correo a ${m.name}`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center border border-foreground/20 text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Mail size={16} aria-hidden />
                    </a>
                  )}
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
