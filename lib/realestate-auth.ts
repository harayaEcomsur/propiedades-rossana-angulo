import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";
import { SignJWT, jwtVerify } from "jose";
import { brokerByEmail, type Broker } from "@/lib/realestate-store";
import { checkRateLimit } from "@/lib/rate-limit";

// Acceso al panel /inmobiliaria/admin. Mismo esquema de dos métodos que
// lib/auth.ts (Agenda), pero la allowlist NO es config estática: vive en
// re_brokers (Rossana agrega/quita corredoras desde el propio panel, sin
// redesplegar). Cookie separada de la de Agenda por si un cliente algún día
// usa ambos módulos en el mismo sitio.
//
//  1. Google (recomendado): cada corredora entra con su cuenta, autorizada
//     contra re_brokers.email.
//  1b. Superadministradores: correos en SUPERADMIN_EMAILS (env, separados por
//     coma). Entran con Google como admin, pero no están en re_brokers: no
//     aparecen en la lista de usuarios ni se pueden desactivar desde el panel.
//     Es el acceso de HarayaDev, que mantiene el sitio.
//  2. Clave compartida (bootstrap): ?clave=... contra REALESTATE_ADMIN_KEY,
//     siempre admin — es la forma en que Rossana entra la primera vez, antes
//     de que exista ningún corredor en la base, para poder agregarse a ella
//     misma y a las demás desde el panel.

const SESSION_COOKIE = "haraya_re_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const CLAVE_COMPARTIDA_EMAIL = "clave-compartida";

function superadminBroker(email: string): Broker | null {
  const list = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!list.includes(email.toLowerCase())) return null;
  return {
    id: `_super:${email.toLowerCase()}`,
    email,
    name: "Superadministrador",
    role: "admin",
    active: true,
    superadmin: true,
    showOnSite: false,
    sortOrder: 0,
    createdAt: new Date(0).toISOString(),
  };
}

async function brokerOrSuperadmin(email: string): Promise<Broker | null> {
  return superadminBroker(email) ?? (await brokerByEmail(email));
}

function sessionSecret(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function verifyGoogleCredentialRE(idToken: string): Promise<Broker | { error: string }> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return { error: "Login con Google no está configurado en este sitio." };

  const client = new OAuth2Client(clientId);
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    return { error: "Token de Google inválido o expirado." };
  }
  const email = payload?.email;
  if (!email || !payload?.email_verified) return { error: "No se pudo verificar el correo de Google." };
  const broker = await brokerOrSuperadmin(email);
  if (!broker) return { error: `${email} no tiene acceso al panel. Pídele a la administradora que te agregue en la pestaña "Usuarios".` };
  return broker;
}

export async function createSessionCookieRE(email: string): Promise<void> {
  const secret = sessionSecret();
  if (!secret) throw new Error("Falta SESSION_SECRET");
  const jwt = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);

  (await cookies()).set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookieRE(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

async function sessionBrokerFromCookie(): Promise<Broker | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const jwt = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secret);
    const email = typeof payload.email === "string" ? payload.email : null;
    return email ? await brokerOrSuperadmin(email) : null;
  } catch {
    return null;
  }
}

// Comparación en tiempo constante (evita que un atacante infiera la clave
// midiendo cuánto tarda la respuesta según cuántos caracteres acertó).
function igualSeguro(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

// La clave compartida da rol admin completo sobre contratos, clientes y
// propiedades reales: sin límite de intentos se podía probar por fuerza
// bruta (brecha de la misma clase reportada en otro sitio el 2026-11-02).
// Tope por IP, independiente del límite del resto del sitio.
function claveBroker(claveCandidate: string | null | undefined, ip: string): Broker | null {
  const key = process.env.REALESTATE_ADMIN_KEY;
  if (!key || !claveCandidate) return null;
  const limite = checkRateLimit(`auth-clave-re:ip:${ip}`);
  if (!limite.allowed) return null;
  if (!igualSeguro(claveCandidate, key)) return null;
  return {
    id: "_clave",
    email: CLAVE_COMPARTIDA_EMAIL,
    name: "Administradora",
    role: "admin",
    active: true,
    showOnSite: false,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function currentBroker(claveCandidate: string | null | undefined, ip: string): Promise<Broker | null> {
  return (await sessionBrokerFromCookie()) ?? claveBroker(claveCandidate, ip);
}

export async function currentAdminBroker(claveCandidate: string | null | undefined, ip: string): Promise<Broker | null> {
  const broker = await currentBroker(claveCandidate, ip);
  return broker?.role === "admin" ? broker : null;
}

export function googleLoginEnabledRE(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.SESSION_SECRET);
}

export function claveLoginEnabledRE(): boolean {
  return Boolean(process.env.REALESTATE_ADMIN_KEY);
}
