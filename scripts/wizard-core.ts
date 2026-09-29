// Lógica compartida entre el wizard interactivo (new-client) y la fábrica de
// demos no interactiva (new-demo): slug, sugerencias por rubro, y las
// transformaciones de config (identidad + paleta desde el logo).
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import {
  extractColors,
  pickPalette,
  ensureContrastWithWhite,
  hexToRgb,
  rgbToHex,
  hslToRgb,
} from "./palette-core";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// El layout es lo primero que evita que todo se vea igual: se sugiere por rubro.
export function suggestLayout(rubro: string): "inmobiliaria" | "corporativo" | "clasico" {
  const r = rubro.toLowerCase();
  if (/(inmobili|propiedad|corretaje|corredor)/.test(r)) return "inmobiliaria";
  if (/(abogad|juridic|jurídic|legal|contab|contador|consultor|auditor|notari|arquitect|ingenier)/.test(r))
    return "corporativo";
  return "clasico";
}

export function suggestPreset(rubro: string): string {
  const r = rubro.toLowerCase();
  if (/(inmobili|propiedad|corretaje|corredor)/.test(r)) return "inmobiliaria";
  if (/(restauran|comida|food|cafe|café|pasteler|panader|sushi|pizz|brownie|dulce|tienda|almacen|almacén)/.test(r))
    return "restaurante";
  if (/(barber|peluquer|estetic|estétic|salon|salón|spa|manicur|uñas|nails)/.test(r)) return "barberia";
  if (/(abogad|jurid|juríd|contab|contador|consultor)/.test(r)) return "profesional";
  return "_template";
}

export interface Identity {
  businessName: string;
  slug: string;
  rubro?: string;
  style?: string;
  layout?: string;
  whatsapp?: string; // solo dígitos, ej. 56912345678
  phone?: string;
  email?: string;
  address?: string;
}

// Aplica la identidad del cliente sobre el contenido de un preset:
// meta + reemplazo del nombre del negocio EN TODO EL COPY (hero, nosotros,
// chat, mensajes de WhatsApp…) + contacto + SEO. Esto es lo que antes se hacía
// a mano y costaba la mayor parte de los minutos por demo.
export function applyIdentity(content: string, id: Identity): string {
  // Nombre original del preset, para reemplazarlo en todo el copy.
  const originalName = content.match(/businessName:\s*"([^"]*)"/)?.[1];

  let out = content
    .replace(/slug:\s*"[^"]*"/, `slug: "${id.slug}"`)
    .replace(/businessName:\s*"[^"]*"/, `businessName: "${id.businessName}"`);
  if (id.rubro) out = out.replace(/rubro:\s*"[^"]*"/, `rubro: "${id.rubro}"`);
  if (id.style) out = out.replace(/fontPairing:\s*"[^"]*"/, `fontPairing: "${id.style}"`);
  if (id.layout && !out.includes("layout:")) {
    out = out.replace(/fontPairing:\s*"([^"]*)",/, `fontPairing: "$1",\n    layout: "${id.layout}",`);
  }

  // El copy del preset menciona el negocio ficticio muchas veces — todas pasan
  // a ser el negocio real. (Los paths de assets usan el slug del preset, no el
  // nombre, así que no se rompen.)
  if (originalName && originalName !== id.businessName) {
    out = out.split(originalName).join(id.businessName);
  }

  if (id.whatsapp) {
    const digits = id.whatsapp.replace(/\D/g, "");
    out = out.replace(/whatsapp:\s*"[^"]*"/, `whatsapp: "${digits}"`);
    if (!id.phone) {
      const pretty = digits.startsWith("56")
        ? `+56 ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
        : `+${digits}`;
      out = out.replace(/phone:\s*"[^"]*"/, `phone: "${pretty}"`);
    }
  }
  if (id.phone) out = out.replace(/phone:\s*"[^"]*"/, `phone: "${id.phone}"`);
  if (id.email) out = out.replace(/email:\s*"[^"]*"/, `email: "${id.email}"`);
  if (id.address) {
    out = out
      .replace(/address:\s*"[^"]*"/, `address: "${id.address}"`)
      .replace(/mapQuery:\s*"[^"]*"/, `mapQuery: "${id.address}, Chile"`);
  }

  // SEO coherente con el negocio real (solo dentro del bloque seo:).
  if (id.rubro) {
    out = out.replace(/(seo:\s*\{[\s\S]*?title:\s*)"[^"]*"/, `$1"${id.businessName} — ${cap(id.rubro)}"`);
  }
  return out;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface PaletteResult {
  content: string;
  note: string;
}

// Copia el logo a public/clients/<slug>/, extrae la paleta y escribe
// branding + variantes A/B/C en el config. Compartido por wizard y fábrica.
export function applyLogoAndPalette(content: string, slug: string, logoPath: string): PaletteResult {
  if (!existsSync(logoPath)) return { content, note: `- ⚠ Logo no encontrado en ${logoPath}.` };

  const assetsDir = path.join(process.cwd(), "public", "clients", slug);
  mkdirSync(assetsDir, { recursive: true });
  const ext = path.extname(logoPath).toLowerCase() || ".png";
  const logoDest = path.join(assetsDir, `logo${ext}`);
  if (path.resolve(logoPath) !== path.resolve(logoDest)) copyFileSync(logoPath, logoDest);

  try {
    const p = pickPalette(extractColors(logoDest));
    const accentAsPrimary = ensureContrastWithWhite(hexToRgb(p.accent)!);
    const darkBg = hslToRgb(p.baseHsl.h, 0.3, 0.1);
    const darkPrimary = ensureContrastWithWhite(hslToRgb(p.baseHsl.h, Math.max(p.baseHsl.s, 0.5), 0.45));
    // Si el preset ya traía variantes de ejemplo, se reemplazan por las del
    // logo real (dejar ambas duplicaría la propiedad y rompe el typecheck).
    let out = content
      .replace(/\n  themeVariants: \[[\s\S]*?\n  \],\n/, "\n")
      .replace(/logoUrl:\s*"[^"]*"/, `logoUrl: "/clients/${slug}/logo${ext}"`)
      .replace(/faviconUrl:\s*"[^"]*"/, `faviconUrl: "/clients/${slug}/logo${ext}"`)
      .replace(/primary:\s*"[^"]*"/, `primary: "${p.primary}"`)
      .replace(/accent:\s*"[^"]*"/, `accent: "${p.accent}"`)
      .replace(/background:\s*"[^"]*"/, `background: "${p.background}"`)
      .replace(/foreground:\s*"[^"]*"/, `foreground: "${p.foreground}"`);
    const variants = `
  themeVariants: [
    { id: "a", name: "Fiel al logo", palette: { primary: "${p.primary}", accent: "${p.accent}", background: "${p.background}", foreground: "${p.foreground}" } },
    { id: "b", name: "Acento protagonista", palette: { primary: "${rgbToHex(accentAsPrimary.color)}", accent: "${p.primary}", background: "${rgbToHex(hslToRgb(p.accentHsl.h, 0.18, 0.98))}", foreground: "${p.foreground}" } },
    { id: "c", name: "Modo oscuro", palette: { primary: "${rgbToHex(darkPrimary.color)}", accent: "${p.accent}", background: "${rgbToHex(darkBg)}", foreground: "#F4F2EF" } },
  ],
`;
    out = out.replace(/\n  seo: \{/, `${variants}\n  seo: {`);
    const note = `- Paleta extraída del logo: primary ${p.primary}, accent ${p.accent}${
      p.primaryAdjusted ? ` (primary oscurecido desde ${p.primaryOriginal} por contraste WCAG)` : ""
    }\n- Variantes A/B/C generadas — enviar /variantes al cliente para que elija.`;
    return { content: out, note };
  } catch {
    return { content, note: "- ⚠ No se pudo extraer paleta del logo (¿blanco y negro?). Elegir a mano." };
  }
}
