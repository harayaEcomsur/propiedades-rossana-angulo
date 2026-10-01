"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Instagram, Pause, Play } from "lucide-react";
import type { InstagramPost } from "@/lib/instagram";

const INTERVAL_MS = 4000;

// Carrusel del feed de Instagram que rota solo. Se pausa al pasar el mouse, al
// enfocar con teclado, con la pestaña oculta y con el botón de pausa (WCAG
// 2.2.2: todo lo que se mueve solo necesita cómo detenerlo). Con "reducir
// movimiento" no rota: queda como carrusel manual.
export function InstagramCarousel({ posts }: { posts: InstagramPost[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.querySelector<HTMLElement>("li");
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    const width = (item?.offsetWidth ?? track.clientWidth) + gap;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const atStart = track.scrollLeft <= 4;
    if (dir === 1 && atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && atStart) track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
    else track.scrollBy({ left: dir * width, behavior: "smooth" });
  }, []);

  const autoplay = !paused && !hovering && !reducedMotion;
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      if (!document.hidden) step(1);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autoplay, step]);

  const controlCls =
    "inline-flex h-11 w-11 items-center justify-center border border-foreground/20 bg-background text-foreground transition-colors hover:border-primary hover:text-primary";

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovering(false);
      }}
    >
      <ul
        ref={trackRef}
        aria-label="Publicaciones recientes de Instagram"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => (
          <li key={post.id} className="w-[72%] shrink-0 snap-start sm:w-[40%] lg:w-[calc((100%-3rem)/4)]">
            <a
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
                // Instagram ya sirve las fotos optimizadas desde su CDN, y sus
                // URLs firmadas son muy largas: pasar por el optimizador las
                // repetía en 8 tamaños y engordaba el HTML ~120 KB.
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="line-clamp-3 text-sm leading-snug text-white">{post.caption}</span>
              </span>
              <Instagram size={18} className="absolute right-3 top-3 text-white drop-shadow" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" onClick={() => step(-1)} className={controlCls} aria-label="Publicación anterior">
          <ChevronLeft size={18} aria-hidden />
        </button>
        {!reducedMotion && (
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            className={controlCls}
            aria-label={paused ? "Reanudar el carrusel" : "Pausar el carrusel"}
            aria-pressed={paused}
          >
            {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
          </button>
        )}
        <button type="button" onClick={() => step(1)} className={controlCls} aria-label="Publicación siguiente">
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
