import { clearSessionCookieRE } from "@/lib/realestate-auth";

export const runtime = "nodejs";

export async function POST() {
  await clearSessionCookieRE();
  return Response.json({ ok: true });
}
