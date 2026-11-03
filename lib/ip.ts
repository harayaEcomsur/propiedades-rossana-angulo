import { headers as nextHeaders } from "next/headers";

// IP del visitante para los límites de intentos (lib/rate-limit.ts). En Vercel
// x-forwarded-for la arma el propio edge (el primer valor es el cliente real),
// así que no se puede falsificar desde el navegador.
export function ipDe(req: Request): string {
  return ipFromHeaders(req.headers);
}

function ipFromHeaders(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
}

// Mismo cálculo, pero para Server Components (app/*/admin/page.tsx), que no
// reciben un Request — solo next/headers().
export async function ipDeServerComponent(): Promise<string> {
  return ipFromHeaders(await nextHeaders());
}
