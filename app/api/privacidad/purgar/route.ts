import { purgeExpiredData } from "@/lib/privacy-store";
import { esCronAutorizado } from "@/lib/cron-auth";

export const runtime = "nodejs";

// Purga diaria de datos que ya superaron su plazo de retención (Ley 21.719 —
// ver lib/privacy.ts). La dispara Vercel Cron (vercel.json), autenticada con
// CRON_SECRET — ver lib/cron-auth.ts. Hasta 2026-11-02 también aceptaba la
// clave de admin por query sin límite de intentos (oráculo).
function isAuthorized(req: Request): boolean {
  return esCronAutorizado(req);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return Response.json({ error: "No autorizado" }, { status: 401 });

  try {
    const borradas = await purgeExpiredData();
    return Response.json({ ok: true, borradas });
  } catch (error) {
    console.error("Error en la purga de datos vencidos:", error);
    return Response.json({ error: "No se pudo completar la purga" }, { status: 500 });
  }
}
