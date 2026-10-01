// Acorta un texto a `max` caracteres sin cortar palabras (para meta
// descriptions: Google muestra ~155-160).
export function shortText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:·\s]+$/, "")}…`;
}

// "Valores" → "valores", "Tarifas y planes" → "tarifas-y-planes" (para anclas).
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
