import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { clientConfig } from "@/config/client.config";
import { currentAdminBroker } from "@/lib/realestate-auth";
import {
  EDITABLE_SECTIONS,
  SITE_CONTENT_TAG,
  getEditableContent,
  getSiteOverrides,
  saveSiteSection,
  siteContentSchema,
  type EditableSection,
} from "@/lib/site-content";

// CMS del sitio (pestaña "Sitio" del panel): solo administradoras.
//  GET → contenido vigente de cada sección + cuáles fueron editadas.
//  PUT {section, value} → guarda la sección; {section, value: null} la
//      devuelve al texto original del código.
export const runtime = "nodejs";

function claveFromRequest(req: Request): string | null {
  return req.headers.get("x-re-key") ?? new URL(req.url).searchParams.get("clave");
}

async function authorize(req: Request) {
  if (!clientConfig.modules.inmobiliariaAdmin) return Response.json({ error: "No habilitado" }, { status: 404 });
  const admin = await currentAdminBroker(claveFromRequest(req));
  if (!admin) return Response.json({ error: "Solo la administradora puede editar el sitio" }, { status: 403 });
  return null;
}

export async function GET(req: Request) {
  const denied = await authorize(req);
  if (denied) return denied;
  const [content, overrides] = await Promise.all([getEditableContent(), getSiteOverrides()]);
  return Response.json({ content, edited: Object.keys(overrides) });
}

const putSchema = z.object({
  section: z.enum(EDITABLE_SECTIONS as [EditableSection, ...EditableSection[]]),
  value: z.unknown(),
});

export async function PUT(req: Request) {
  const denied = await authorize(req);
  if (denied) return denied;

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 400 });
  const { section, value } = parsed.data;

  if (value !== null) {
    const check = siteContentSchema.shape[section].safeParse(value);
    if (!check.success) {
      const first = check.error.issues[0];
      return Response.json(
        { error: `Revisa "${first?.path.join(" › ") || section}": ${first?.message ?? "dato inválido"}` },
        { status: 400 }
      );
    }
  }

  try {
    await saveSiteSection(section, value);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo guardar" }, { status: 500 });
  }

  // Publica el cambio al instante: caché del contenido + todas las páginas.
  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
