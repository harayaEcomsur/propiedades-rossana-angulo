// Avatar ilustrado mientras no hay foto: degradado suave, iniciales en serif y
// el trazo del techo del logo como detalle. Los tonos combinan con el rojo y
// el negro de la marca; el primero (carbón) es para quien encabeza el equipo.
const TONES = [
  { from: "#2B2323", to: "#4A3A3A", text: "#FBF3EF", line: "#DD3333" }, // carbón
  { from: "#F6DDD5", to: "#E7B3A5", text: "#7A2E2A", line: "#FFFFFF" }, // rubor
  { from: "#F1E7DA", to: "#DBC6AA", text: "#5A4430", line: "#FFFFFF" }, // arena
  { from: "#E4EAE5", to: "#BFCDC4", text: "#35493D", line: "#FFFFFF" }, // salvia
  { from: "#E8E1EE", to: "#C9BAD6", text: "#4A3A5C", line: "#FFFFFF" }, // lavanda
];

// "María de los Ángeles Thauby" → "MT": primera letra del primer nombre y del apellido.
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(w));
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function TeamAvatar({ name, index }: { name: string; index: number }) {
  const tone = TONES[index % TONES.length];
  const id = `avatar-grad-${index}`;
  return (
    <svg viewBox="0 0 128 128" className="h-full w-full" role="img" aria-label={`Avatar de ${name}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone.from} />
          <stop offset="100%" stopColor={tone.to} />
        </linearGradient>
      </defs>
      <rect width="128" height="128" fill={`url(#${id})`} />
      {/* Techo con chimenea, como en el logo: detalle de marca muy sutil */}
      <path
        d="M22 96 L64 62 L106 96 M88 81 V70 H96 V87"
        fill="none"
        stroke={tone.line}
        strokeOpacity="0.35"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="64"
        y="56"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={tone.text}
        style={{ fontFamily: "var(--font-heading)", fontSize: 36, fontWeight: 600, letterSpacing: "0.06em" }}
      >
        {initials(name)}
      </text>
    </svg>
  );
}
