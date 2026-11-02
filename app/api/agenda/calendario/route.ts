import { createHash, timingSafeEqual } from "crypto";
import { clientConfig } from "@/config/client.config";
import { listBookings } from "@/lib/booking-store";
import { buildIcsFeed } from "@/lib/calendar";
import { checkRateLimit } from "@/lib/rate-limit";
import { ipDe } from "@/lib/ip";

// Feed ICS de la agenda para suscripción desde Google Calendar / Outlook / Apple.
// Protegido con la clave de admin vía query (?clave=) porque los calendarios no
// envían headers al refrescar. Google refresca feeds por URL cada algunas horas.
// La clave SÍ tiene que ir en la URL para este endpoint (es el único formato
// que soportan los clientes de calendario) — por eso lleva su propio límite de
// intentos y comparación en tiempo constante, en vez de intentar quitarla de
// la URL como se hizo en el resto del panel (2026-11-02).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function igualSeguro(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export async function GET(req: Request) {
  if (!clientConfig.modules.agenda) return new Response("No disponible", { status: 404 });
  const key = process.env.AGENDA_ADMIN_KEY;
  const clave = new URL(req.url).searchParams.get("clave");
  if (!key || !clave) return new Response("No autorizado", { status: 401 });
  const limite = checkRateLimit(`agenda-ics:ip:${ipDe(req)}`);
  if (!limite.allowed) {
    return new Response("Demasiados intentos. Espera unos minutos.", {
      status: 429,
      headers: { "Retry-After": String(limite.retryAfterSeconds) },
    });
  }
  if (!igualSeguro(clave, key)) return new Response("No autorizado", { status: 401 });

  return new Response(buildIcsFeed(await listBookings()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="agenda-${clientConfig.meta.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
