import { z } from "zod";
import { getSiteConfig } from "@/lib/site-content";

export const runtime = "nodejs";

const contactSchema = z.object({
  name: z.string().min(1),
  contactInfo: z.string().min(1),
  message: z.string().min(1).max(2000),
  // Asesor elegido en el formulario (opcional): se recibe solo el NOMBRE y el
  // correo se busca acá, en el equipo publicado — así el formulario no sirve
  // para mandar correos a direcciones arbitrarias.
  advisor: z.string().max(120).optional(),
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const clientConfig = await getSiteConfig();
  const destination = clientConfig.contact.email;
  const apiKey = process.env.RESEND_API_KEY;

  if (!destination || !apiKey) {
    return Response.json(
      { error: "El formulario de contacto no está configurado (falta email de destino o RESEND_API_KEY)." },
      { status: 501 }
    );
  }

  const { name, contactInfo, message, advisor } = parsed.data;
  const chosen = advisor ? clientConfig.team?.find((m) => m.name === advisor) : undefined;
  if (advisor && !chosen) return Response.json({ error: "El asesor elegido no está disponible." }, { status: 400 });
  // Con asesor: le llega a él/ella con copia a la casilla principal (no se
  // pierde ningún contacto). Sin asesor (o sin correo): solo a la principal.
  const to = chosen?.email && chosen.email.toLowerCase() !== destination.toLowerCase() ? chosen.email : destination;
  const cc = to !== destination ? destination : undefined;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Remitente con el dominio propio (verificado en Resend). Sin EMAIL_FROM,
      // la dirección de prueba de Resend, que solo entrega al dueño de la cuenta.
      from: process.env.EMAIL_FROM || "Sitio web <onboarding@resend.dev>",
      to,
      ...(cc ? { cc } : {}),
      // Si el visitante dejó un correo, "Responder" le contesta directo a él.
      ...(emailPattern.test(contactInfo.trim()) ? { reply_to: contactInfo.trim() } : {}),
      subject: chosen
        ? `Nuevo contacto para ${chosen.name}: ${name} — ${clientConfig.meta.businessName}`
        : `Nuevo contacto de ${name} — ${clientConfig.meta.businessName}`,
      text: [
        `Nombre: ${name}`,
        `Contacto: ${contactInfo}`,
        chosen ? `Quiere hablar con: ${chosen.name}` : "Asesor: sin preferencia",
        "",
        "Mensaje:",
        message,
      ].join("\n"),
    }),
  });

  if (!res.ok) {
    return Response.json({ error: "No se pudo enviar el mensaje. Intenta más tarde." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
