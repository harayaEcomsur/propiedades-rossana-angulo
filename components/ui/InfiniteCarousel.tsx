"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

// Carrusel infinito con autoplay, base de todos los carruseles del sitio.
//
// Infinito sin saltos visibles: las diapositivas se renderizan tres veces
// (A·A·A) y se arranca en la copia del medio. Al terminar cada desplazamiento,
// si quedó en la primera o la tercera copia, se reposiciona en la del medio
// con un salto instantáneo de exactamente un juego (mismo contenido en el
// mismo lugar, así que no se nota). El desplazamiento es el scroll nativo del
// navegador: en celular se desliza con el dedo y encaja en cada tarjeta.
//
// Autoplay que se pausa al pasar el mouse, al tocar, con foco de teclado, con
// la pestaña oculta y con el botón de pausa (WCAG 2.2.2). Con "reducir
// movimiento" no hay autoplay. Las copias de relleno quedan fuera del árbol de
// accesibilidad (aria-hidden + inert) para que se lea un solo juego.

const SCROLL_END_FALLBACK_MS = 140;

export function InfiniteCarousel({
  slides,
  ariaLabel,
  slideClassName,
  interval = 4500,
  gapClassName = "gap-4",
}: {
  slides: React.ReactNode[];
  ariaLabel: string;
  // Ancho de cada diapositiva, ej. "w-[85%] sm:w-[48%] lg:w-[calc((100%-4rem)/3)]".
  slideClassName: string;
  interval?: number;
  gapClassName?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;

  // Ancho de un juego completo: distancia entre la 1ª diapositiva del juego 2 y del juego 1.
  const setWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track || count === 0) return 0;
    const items = track.children as HTMLCollectionOf<HTMLElement>;
    return items[count] ? items[count].offsetLeft - items[0].offsetLeft : 0;
  }, [count]);

  const recenter = useCallback(() => {
    const track = trackRef.current;
    const w = setWidth();
    if (!track || !w) return;
    if (track.scrollLeft < w * 0.5) track.scrollLeft += w;
    else if (track.scrollLeft >= w * 1.5) track.scrollLeft -= w;
  }, [setWidth]);

  // Copias de relleno: inert (sin foco ni lector de pantalla). Se asigna en el
  // DOM porque React 18 no maneja el atributo `inert`.
  useEffect(() => {
    trackRef.current?.querySelectorAll<HTMLElement>("[data-clone]").forEach((el) => {
      el.inert = true;
    });
  }, [slides]);

  // Arranca en la copia del medio (antes de pintar, sin parpadeo).
  useLayoutEffect(() => {
    const track = trackRef.current;
    const w = setWidth();
    if (track && w) track.scrollLeft = w;
  }, [setWidth]);

  // Reposiciona al terminar cada desplazamiento (scrollend o, si no existe, debounce).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timer: number | undefined;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(recenter, SCROLL_END_FALLBACK_MS);
    };
    const supportsScrollEnd = "onscrollend" in window;
    if (supportsScrollEnd) track.addEventListener("scrollend", recenter);
    else track.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => recenter();
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      track.removeEventListener("scrollend", recenter);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [recenter]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const track = trackRef.current;
      if (!track) return;
      recenter();
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[1] as HTMLElement | undefined;
      const stepWidth = first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
      track.scrollBy({ left: dir * stepWidth, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [recenter, reducedMotion]
  );

  const autoplay = count > 1 && !paused && !interacting && !reducedMotion;
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      if (!document.hidden) step(1);
    }, interval);
    return () => window.clearInterval(id);
  }, [autoplay, interval, step]);

  if (count === 0) return null;

  const controlCls =
    "inline-flex h-11 w-11 items-center justify-center border border-foreground/20 bg-background text-foreground transition-colors hover:border-primary hover:text-primary";

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label={ariaLabel}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onTouchStart={() => setInteracting(true)}
      onTouchEnd={() => window.setTimeout(() => setInteracting(false), 2500)}
      onFocus={() => setInteracting(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInteracting(false);
      }}
    >
      <ul
        ref={trackRef}
        className={`flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${gapClassName}`}
      >
        {[0, 1, 2].map((copy) =>
          slides.map((slide, i) => {
            const clone = copy !== 1;
            return (
              <li
                key={`${copy}-${i}`}
                className={`shrink-0 snap-start ${slideClassName}`}
                aria-hidden={clone || undefined}
                data-clone={clone ? "" : undefined}
                aria-roledescription={clone ? undefined : "diapositiva"}
                aria-label={clone ? undefined : `${i + 1} de ${count}`}
              >
                {slide}
              </li>
            );
          })
        )}
      </ul>
      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={() => step(-1)} className={controlCls} aria-label="Anterior">
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
          <button type="button" onClick={() => step(1)} className={controlCls} aria-label="Siguiente">
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
