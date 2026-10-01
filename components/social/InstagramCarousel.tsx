import Image from "next/image";
import { Instagram } from "lucide-react";
import { InfiniteCarousel } from "@/components/ui/InfiniteCarousel";
import type { InstagramPost } from "@/lib/instagram";

// Feed de Instagram como carrusel infinito con autoplay (ver
// components/ui/InfiniteCarousel.tsx): 4 por fila en escritorio, ~1,4 en celular.
export function InstagramCarousel({ posts }: { posts: InstagramPost[] }) {
  const slides = posts.map((post) => (
    <a
      key={post.id}
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-square overflow-hidden bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Image
        src={post.mediaUrl}
        alt={post.caption?.slice(0, 120) || "Publicación de Instagram"}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 72vw"
        // Instagram ya sirve las fotos optimizadas desde su CDN, y sus URLs
        // firmadas son muy largas: pasar por el optimizador las repetía en 8
        // tamaños y engordaba el HTML.
        unoptimized
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="line-clamp-3 text-sm leading-snug text-white">{post.caption}</span>
      </span>
      <Instagram size={18} className="absolute right-3 top-3 text-white drop-shadow" aria-hidden />
    </a>
  ));

  return (
    <InfiniteCarousel
      slides={slides}
      ariaLabel="Publicaciones recientes de Instagram"
      slideClassName="w-[72%] sm:w-[40%] lg:w-[calc((100%-3rem)/4)]"
      interval={4000}
    />
  );
}
