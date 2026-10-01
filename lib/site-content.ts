import { unstable_cache } from "next/cache";
import { z } from "zod";
import { clientConfig } from "@/config/client.config";
import { clientConfigSchema, type ClientConfig } from "@/config/schema";
import { db, jsonb, withDb } from "@/lib/db";
import { resolveNav, resolveSections } from "@/lib/section-copy";
import { listBrokers } from "@/lib/realestate-store";

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
    // Títulos de las secciones de la home y nombres del menú.
    titles: z.object({ sections: shape.sections, nav: shape.nav }),
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

// Equipo público = usuarios del panel activos y marcados "mostrar en el sitio",
// en el orden que define la administradora (pestaña Asesores). Cacheado con
// el mismo tag que el contenido: se invalida al editar asesores.
const cachedTeam = unstable_cache(
  async (): Promise<NonNullable<ClientConfig["team"]> | null> => {
    if (!clientConfig.modules.inmobiliariaAdmin) return null;
    const brokers = (await listBrokers()).filter((b) => b.active && b.showOnSite);
    if (brokers.length === 0) return null;
    return brokers.map((b) => ({
      name: b.name,
      role: b.title || (b.role === "admin" ? "Administración" : "Asesor inmobiliario"),
      photoUrl: b.photoUrl,
      bio: b.bio,
      phone: b.phone,
      whatsapp: b.whatsapp,
      email: b.email,
    }));
  },
  ["site-team"],
  { tags: [SITE_CONTENT_TAG], revalidate: 300 }
);

type Sections = NonNullable<ClientConfig["sections"]>;
function mergeSections(base: ClientConfig["sections"], over: ClientConfig["sections"]): Sections {
  const out: Record<string, Record<string, string | undefined>> = { ...(base ?? {}) };
  for (const [group, fields] of Object.entries(over ?? {})) out[group] = { ...(out[group] ?? {}), ...(fields ?? {}) };
  return out as Sections;
}

// Config que ve el público: el del código con las secciones editadas encima.
export async function getSiteConfig(): Promise<ClientConfig> {
  const [o, team] = await Promise.all([getSiteOverrides(), cachedTeam()]);
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
    // Campo por campo sobre lo del config: un texto que nunca se guardó en el
    // panel sigue saliendo del config (y un "" guardado sí lo deja en blanco).
    ...(o.titles && { sections: mergeSections(clientConfig.sections, o.titles.sections), nav: { ...clientConfig.nav, ...o.titles.nav } }),
    // Los asesores del panel mandan sobre el equipo del config/CMS.
    ...(team && { team }),
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
    // Se edita sobre los textos vigentes (defaults + config + lo guardado).
    titles: { sections: resolveSections(site), nav: resolveNav(site) },
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
