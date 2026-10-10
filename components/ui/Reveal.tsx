// Entrada suave (fade + subida corta) hecha SOLO con CSS, igual que en
// mandagroup: sin JavaScript ni IntersectionObserver. Antes un script tenía
// que detectar cada bloque y recién ahí empezaba la transición (más los
// retrasos escalonados), así que en escritorio los bloques bajo el hero se
// sentían "tarde".
//
// - "scroll" (por defecto): animación ligada al scroll (animation-timeline:
//   view()). El bloque se revela a medida que entra en pantalla, al ritmo del
//   propio scroll: nunca llega tarde, y lo que ya está en pantalla al cargar
//   se ve de inmediato. Navegadores sin soporte lo muestran directo.
// - "load": para lo que está arriba del pliegue; corre apenas se pinta el
//   HTML, sin esperar a React.
// Con prefers-reduced-motion todo queda estático (ver app/globals.css).
export function Reveal({
  children,
  delay = 0,
  className = "",
  mode = "scroll",
}: {
  children: React.ReactNode;
  delay?: number; // ms; en "scroll" se traduce a un pequeño desfase del rango de entrada
  className?: string;
  mode?: "scroll" | "load";
}) {
  return (
    <div
      style={
        {
          "--reveal-delay": `${delay}ms`,
          // 80 ms de "delay" ≈ 8% más tarde dentro del rango de entrada.
          "--reveal-offset": `${Math.min(delay / 10, 30)}%`,
        } as React.CSSProperties
      }
      className={`${mode === "load" ? "reveal-load" : "reveal"} ${className}`}
    >
      {children}
    </div>
  );
}
