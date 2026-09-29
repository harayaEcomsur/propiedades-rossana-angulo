import { refreshInstagramToken } from "@/lib/instagram";

// Cron semanal (vercel.json): renueva el token de Instagram, que vence a los 60
// días. El token nuevo queda en la tabla `settings` (ver lib/instagram.ts).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret) && req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) return Response.json({ ok: true, skipped: "Instagram no configurado" });
  const result = await refreshInstagramToken();
  if (!result.ok) console.error("[instagram] no se pudo renovar el token:", result.error);
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
