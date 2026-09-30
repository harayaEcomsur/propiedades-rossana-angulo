import Image from "next/image";
import { Instagram } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/layouts/inmobiliaria/SectionHeading";
import { InstagramCarousel } from "@/components/social/InstagramCarousel";
import { getInstagramFeed, instagramHandle } from "@/lib/instagram";

// Se muestra automáticamente cuando el config trae un link de Instagram
// (contact.socials) — sin token configurado, solo el botón de seguir; con
// INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID (ver README), las fotos reales:
// grilla de 6 (`grid`) o carrusel que rota con las últimas 12 (`carousel`).
export async function InstagramFeed({
  instagramUrl,
  businessName,
  variant = "grid",
  tagline,
}: {
  instagramUrl: string;
  businessName: string;
  variant?: "grid" | "carousel";
  tagline?: string;
}) {
  const posts = await getInstagramFeed(variant === "carousel" ? 12 : 6);
  const handle = instagramHandle(instagramUrl);
  const followButton = (
    <a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 border-[1.5px] border-foreground/20 px-6 py-3 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <Instagram size={18} aria-hidden />
      Seguir {handle}
    </a>
  );

  if (variant === "carousel") {
    return (
      <section id="instagram" className="overflow-hidden py-20 sm:py-28">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Instagram" title="Síguenos en Instagram" subtitle={tagline ?? `${handle} — novedades de ${businessName}.`} />
            {followButton}
          </div>
          {posts && posts.length > 0 && (
            <div className="mt-12">
              <InstagramCarousel posts={posts} />
            </div>
          )}
        </Container>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="flex flex-col items-center gap-3 text-center">
          <Instagram className="text-primary" size={32} />
          <h2 className="font-heading text-3xl font-bold text-foreground">Síguenos en Instagram</h2>
          <p className="text-foreground/70">
            {tagline ?? `${handle} — novedades, trabajos y promociones de ${businessName}.`}
          </p>
        </div>

        {posts && posts.length > 0 ? (
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
            {posts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <Image
                  src={post.mediaUrl}
                  alt={post.caption?.slice(0, 120) || "Publicación de Instagram"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(min-width: 1024px) 16vw, 33vw"
                />
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex justify-center">{followButton}</div>
      </Container>
    </section>
  );
}
