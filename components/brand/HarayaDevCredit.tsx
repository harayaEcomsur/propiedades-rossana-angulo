// Crédito "Sitio hecho por HarayaDev" con el isotipo y el wordmark oficiales
// (mismos trazos que harayadev/components/layout/Logo.tsx). `tone` según el
// fondo donde va: "dark" = texto claro, "light" = texto oscuro.
export function HarayaDevCredit({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const muted = tone === "dark" ? "text-white/55" : "text-black/55";
  const word = tone === "dark" ? "text-white" : "text-[#111]";
  return (
    <a
      href="https://haraya.dev/como-lo-hicimos"
      target="_blank"
      rel="noopener"
      className="group inline-flex items-center gap-2.5"
      aria-label="Sitio hecho por HarayaDev"
    >
      <span className={`text-xs ${muted}`}>Sitio hecho por</span>
      <svg width="22" height="22" viewBox="0 0 512 512" aria-hidden="true" focusable="false" className="transition-transform group-hover:scale-110">
        <rect width="512" height="512" rx="107" fill="#FF3D3D" />
        <path d="M102 216 L184 283 L102 350" fill="none" stroke="#fff" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="214" y="330" width="110" height="26" rx="10" fill="#fff" />
        <rect x="354" y="210" width="55" height="146" rx="12" fill="#fff" />
      </svg>
      <span className={`text-sm font-black tracking-tight ${word}`} style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
        Haraya<span className="text-[#FF3D3D]">Dev</span>
      </span>
    </a>
  );
}
