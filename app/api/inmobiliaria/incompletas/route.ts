import { clientConfig } from "@/config/client.config";
import { listBrokers, listProperties } from "@/lib/realestate-store";
import { missingFields } from "@/lib/property-completeness";
import { getSiteConfig } from "@/lib/site-content";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/seo";

// Cron semanal (vercel.json): correo a la administración con las propiedades
// publicadas (activas o reservadas) a las que les falta información. Si no hay
// ninguna incompleta, no se envía nada.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!clientConfig.modules.inmobiliariaAdmin) return Response.json({ ok: true, skipped: "panel no habilitado" });

  const [properties, brokers, site] = await Promise.all([listProperties(), listBrokers(), getSiteConfig()]);
  const names = new Map(brokers.map((b) => [b.id, b.name]));
  const incomplete = properties
    .filter((p) => p.status === "activa" || p.status === "reservada")
    .map((p) => ({ p, faltan: missingFields(p) }))
    .filter((x) => x.faltan.length > 0);

  if (!incomplete.length || !site.contact.email) return Response.json({ ok: true, incompletas: incomplete.length, sent: false });

  const sent = await sendEmail({
    to: site.contact.email,
    subject: `${incomplete.length} ${incomplete.length === 1 ? "propiedad publicada necesita" : "propiedades publicadas necesitan"} información`,
    text: [
      "Estas propiedades están publicadas en el sitio pero les faltan datos. Con la ficha completa se ven mejor y aparecen mejor en Google:",
      "",
      ...incomplete.flatMap(({ p, faltan }) => [`• ${p.title} (${names.get(p.brokerId) ?? "sin asesor"})`, `  Falta: ${faltan.join(", ")}`, ""]),
      `Complétalas en el panel: ${absoluteUrl("/admin")} → Propiedades → Editar.`,
    ].join("\n"),
  });
  return Response.json({ ok: true, incompletas: incomplete.length, sent });
}
