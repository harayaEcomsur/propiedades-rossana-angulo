import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { addTestimonial } from "@/lib/testimonial-store";
import { sendEmail } from "@/lib/email";
import { getSiteConfig } from "@/lib/site-content";
import { absoluteUrl } from "@/lib/seo";

// Recibe testimonios del formulario de /opina. Entran "pendientes": nada se
// publica sin aprobación en el panel. Avisa por correo a la casilla principal.
export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.string().trim().email("Revisa tu correo"),
  rating: z.number().int().min(1).max(5),
  quote: z.string().trim().min(15, "Cuéntanos un poco más (al menos 15 caracteres)").max(800, "Máximo 800 caracteres"),
  consent: z.literal(true, { errorMap: () => ({ message: "Debes aceptar el uso de tu testimonio" }) }),
  // Campo trampa: invisible para personas; si llega con texto, es un bot.
  website: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const { allowed, retryAfterSeconds } = checkRateLimit(`testimonio:${ip}`);
  if (!allowed) return Response.json({ error: "Demasiados envíos. Intenta en unos minutos." }, { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    // Un bot que llenó el campo trampa recibe "ok" para no darle pistas.
    if (first?.path[0] === "website") return Response.json({ ok: true });
    return Response.json({ error: first?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { name, email, rating, quote } = parsed.data;
  await addTestimonial({ name, email, rating, quote });

  const site = await getSiteConfig();
  if (site.contact.email) {
    await sendEmail({
      to: site.contact.email,
      replyTo: email,
      subject: `Nuevo testimonio por revisar: ${name} (${rating}/5)`,
      text: [
        `${name} (${email}) dejó un testimonio de ${rating}/5 estrellas:`,
        "",
        `"${quote}"`,
        "",
        `No se publica hasta que lo apruebes en el panel: ${absoluteUrl("/admin")} → pestaña Testimonios.`,
      ].join("\n"),
    });
  }
  return Response.json({ ok: true });
}
