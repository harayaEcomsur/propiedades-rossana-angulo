// Encabezado común de las secciones del layout inmobiliario: eyebrow en
// mayúsculas con tracking amplio + titular serif, mismo lenguaje que el hero.
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  tone = "light",
  id,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  id?: string;
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>}
      <h2
        id={id}
        className={`text-balance font-heading text-3xl font-bold leading-tight sm:text-4xl ${
          tone === "dark" ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed ${tone === "dark" ? "text-white/70" : "text-foreground/70"}`}>{subtitle}</p>
      )}
    </div>
  );
}
