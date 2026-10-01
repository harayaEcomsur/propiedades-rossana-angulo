"use client";

import { useEffect, useRef, useState } from "react";

// Aparición suave al entrar en pantalla (fade + 16px hacia arriba).
//
// El contenido llega VISIBLE en el HTML: nunca depende del JavaScript para
// verse (antes se servía oculto y en conexiones lentas las secciones
// aparecían tarde y de a una). Recién al hidratar, y solo para los bloques
// que todavía están bajo el borde de la pantalla (que el visitante no está
// viendo), se ocultan y se animan cuando llegan a la vista. Lo que ya está en
// pantalla al cargar no se toca. Con "reducir movimiento" no se anima nada.
type State = "static" | "hidden" | "shown";

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    // Ya visible (o por encima del borde inferior) al cargar: se queda como está.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const motion =
    state === "static"
      ? ""
      : `transition-[opacity,transform] duration-500 ease-out ${state === "hidden" ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"}`;

  return (
    <div ref={ref} style={state === "shown" && delay ? { transitionDelay: `${delay}ms` } : undefined} className={`${motion} ${className}`}>
      {children}
    </div>
  );
}
