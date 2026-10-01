import { unstable_cache } from "next/cache";
import { z } from "zod";
import { clientConfig } from "@/config/client.config";
import { clientConfigSchema, type ClientConfig } from "@/config/schema";
import { db, jsonb, withDb } from "@/lib/db";

// CMS del sitio: lo que la administradora edita en /inmobiliaria/admin →
// pestaña "Sitio" se guarda en `settings` (clave site_content) y se superpone
// al config del código. Cada sección editada reemplaza a la del config entera;
// las que nunca se tocaron siguen saliendo del config. Así el config sigue
// siendo la base (y el respaldo si la base falla) y el panel solo guarda
// diferencias.

const KEY = "site_content";
export const SITE_CONTENT_TAG = "site-content";

const shape = clientConfigSchema.shape;

// Secciones editables desde el panel. Paleta, módulos, propiedades, etc.
// quedan fuera a propósito: son configuración técnica, no contenido.
export const siteContentSchema = z
  .object({
    hero: shape.hero,
    pillars: shape.pillars,
    services: shape.services,
    about: shape.about,
    team: shape.team,
    testimonials: shape.testimonials,
    faq: shape.faq,
    pricing: shape.pricing,
    contact: shape.contact,
    seo: z.object({ title: z.string().min(5).max(120), description: z.string().min(20).max(300) }),
  })
  .partial();

export type SiteContent = z.infer<typeof siteContentSchema>;
export type EditableSection = keyof SiteContent;
export const EDITABLE_SECTIONS = Object.keys(siteContentSchema.shape) as EditableSection[];

async function readOverrides(): Promise<SiteContent> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = ${KEY} LIMIT 1`;
      const parsed = siteContentSchema.safeParse(rows[0]?.value ?? {});
      if (!parsed.success) console.error("[site-content] contenido guardado inválido, se ignora:", parsed.error.flatten());
      return parsed.success ? parsed.data : {};
    },
    () => ({})
  );
}

// Cacheado entre requests (se invalida con revalidateTag al guardar).
const cachedOverrides = unstable_cache(readOverrides, [KEY], { tags: [SITE_CONTENT_TAG], revalidate: 300 });

export async function getSiteOverrides(): Promise<SiteContent> {
  return cachedOverrides();
}

// Config que ve el público: el del código con las secciones editadas encima.
export async function getSiteConfig(): Promise<ClientConfig> {
  const o = await getSiteOverrides();
  return {
    ...clientConfig,
    ...(o.hero && { hero: o.hero }),
    ...(o.pillars && { pillars: o.pillars }),
    ...(o.services && { services: o.services }),
    ...(o.about && { about: o.about }),
    ...(o.team && { team: o.team }),
    ...(o.testimonials && { testimonials: o.testimonials }),
    ...(o.faq && { faq: o.faq }),
    ...(o.pricing && { pricing: o.pricing }),
    ...(o.contact && { contact: o.contact }),
    ...(o.seo && { seo: { ...clientConfig.seo, ...o.seo } }),
  };
}

// Lo que el panel muestra para editar: el valor vigente de cada sección.
export async function getEditableContent(): Promise<Required<SiteContent>> {
  const site = await getSiteConfig();
  return {
    hero: site.hero,
    pillars: site.pillars ?? [],
    services: site.services,
    about: site.about,
    team: site.team ?? [],
    testimonials: site.testimonials ?? [],
    faq: site.faq ?? [],
    pricing: site.pricing ?? [],
    contact: site.contact,
    seo: { title: site.seo.title, description: site.seo.description },
  };
}

// Guarda una sección (o la borra con `null` para volver a la del código).
export async function saveSiteSection(section: EditableSection, value: unknown | null): Promise<void> {
  const current = await readOverrides();
  const next: Record<string, unknown> = { ...current };
  if (value === null) delete next[section];
  else next[section] = value;
  const validated = siteContentSchema.parse(next);

  const saved = await withDb(
    async () => {
      const sql = db();
      await sql`
        INSERT INTO settings (key, value) VALUES (${KEY}, ${jsonb(validated)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      return true;
    },
    () => false
  );
  if (!saved) throw new Error("No se pudo guardar: el sitio no tiene base de datos configurada");
}
