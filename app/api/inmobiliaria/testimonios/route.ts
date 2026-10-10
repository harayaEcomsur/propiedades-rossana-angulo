import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { clientConfig } from "@/config/client.config";
import { currentAdminBroker } from "@/lib/realestate-auth";
import { deleteTestimonial, listTestimonials, reviewTestimonial } from "@/lib/testimonial-store";
import { SITE_CONTENT_TAG } from "@/lib/site-content";

// Moderación de testimonios (pestaña Testimonios del panel, solo administración).
export const runtime = "nodejs";

function claveFromRequest(req: Request): string | null {
  return req.headers.get("x-re-key") ?? new URL(req.url).searchParams.get("clave");
}

async function authorize(req: Request) {
  if (!clientConfig.modules.inmobiliariaAdmin) return Response.json({ error: "No habilitado" }, { status: 404 });
  if (!(await currentAdminBroker(claveFromRequest(req)))) return Response.json({ error: "Solo un administrador modera testimonios" }, { status: 403 });
  return null;
}

function publish() {
  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/", "layout");
}

export async function GET(req: Request) {
  const denied = await authorize(req);
  if (denied) return denied;
  return Response.json({ testimonials: await listTestimonials() });
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["pendiente", "aprobado", "rechazado"]).optional(),
  name: z.string().trim().min(2).max(80).optional(),
  quote: z.string().trim().min(5).max(800).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function PATCH(req: Request) {
  const denied = await authorize(req);
  if (denied) return denied;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 400 });
  const { id, ...patch } = parsed.data;
  await reviewTestimonial(id, patch);
  publish();
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await authorize(req);
  if (denied) return denied;
  const id = (await req.json().catch(() => null))?.id;
  if (typeof id !== "string") return Response.json({ error: "Datos inválidos" }, { status: 400 });
  await deleteTestimonial(id);
  publish();
  return Response.json({ ok: true });
}
