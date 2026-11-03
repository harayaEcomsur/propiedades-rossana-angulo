import { createHash, timingSafeEqual } from "crypto";

// Endpoints de cron (/api/resumen, /api/privacidad/purgar): solo Vercel Cron
// con `Authorization: Bearer CRON_SECRET`. Hasta 2026-11-02 también aceptaban
// la clave de admin en ?clave=, sin límite de intentos — servía de oráculo
// para adivinarla (401 vs 200) y la dejaba en URLs/logs. Sin CRON_SECRET
// configurado, el endpoint queda cerrado.
export function esCronAutorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (!secret || !header) return false;
  const a = createHash("sha256").update(header).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}
