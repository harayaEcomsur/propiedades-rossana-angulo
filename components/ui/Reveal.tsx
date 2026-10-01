// Aparición suave al entrar en pantalla (fade + 16px hacia arriba).
//
// Es solo un marcador (data-reveal): no espera a que React hidrate la página.
// La animación la maneja un script mínimo en el <head> (lib/reveal-script.ts)
// que corre apenas llega el HTML, y el CSS en app/globals.css. Así las
// secciones se animan como siempre, pero sin el retraso de la hidratación.
// Sin JavaScript, con "reducir movimiento" o si el script falla, el contenido
// se ve directamente (nunca queda oculto).
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div data-reveal="" style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined} className={className}>
      {children}
    </div>
  );
}
