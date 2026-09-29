import { db, jsonb, withDb } from "@/lib/db";

// Integración con Instagram (API de Instagram con inicio de sesión de
// Instagram — cuenta Business/Creator). Tres usos:
//  1. Grilla de la home ("Síguenos en Instagram") con las últimas fotos.
//  2. Importar al panel propiedades que ya están publicadas en Instagram.
//  3. Publicar en Instagram una propiedad cargada en el panel (carrusel).
// Sin INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID nada de esto se activa: la
// home muestra solo el botón "Ver perfil" y el panel oculta los botones.
//
// El token de larga duración vence a los 60 días. El cron
// /api/instagram/refresh lo renueva cada semana y guarda el nuevo en la tabla
// `settings` — desde ahí manda sobre el de la variable de entorno, así nadie
// tiene que volver a pegarlo en Vercel.

const GRAPH = "https://graph.instagram.com";
const TOKEN_KEY = "instagram_token";

export interface InstagramPost {
  id: string;
  caption?: string;
  mediaUrl: string;
  permalink: string;
}

// Publicación completa (con todas las fotos de un carrusel), para importar.
export interface InstagramMedia {
  id: string;
  caption: string;
  permalink: string;
  timestamp: string;
  images: string[];
}

export function instagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID);
}

async function getToken(): Promise<string | null> {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!envToken) return null;
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = ${TOKEN_KEY} LIMIT 1`;
      const stored = rows[0]?.value as { token?: string } | undefined;
      return stored?.token ?? envToken;
    },
    () => envToken
  );
}

// Renueva el token de larga duración (válido 60 días más). Instagram solo
// permite renovar tokens con más de 24h de antigüedad y aún vigentes.
export async function refreshInstagramToken(): Promise<{ ok: boolean; expiresInDays?: number; error?: string }> {
  const token = await getToken();
  if (!token) return { ok: false, error: "Instagram no está configurado" };
  const res = await fetch(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: { message?: string } };
  if (!res.ok || !data.access_token) return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` };

  const saved = await withDb(
    async () => {
      const sql = db();
      const value = { token: data.access_token, refreshedAt: new Date().toISOString() };
      await sql`
        INSERT INTO settings (key, value) VALUES (${TOKEN_KEY}, ${jsonb(value)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      return true;
    },
    () => false
  );
  if (!saved) return { ok: false, error: "Token renovado pero sin DATABASE_URL no se pudo guardar" };
  return { ok: true, expiresInDays: data.expires_in ? Math.round(data.expires_in / 86400) : undefined };
}

async function graphGet<T>(path: string, params: Record<string, string>, init?: RequestInit): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error("Instagram no está configurado");
  const qs = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${GRAPH}/${path}?${qs}`, init ?? { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Instagram respondió ${res.status}`);
  return data as T;
}

async function graphPost<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error("Instagram no está configurado");
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, access_token: token }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Instagram respondió ${res.status}`);
  return data as T;
}

type RawMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: { data: Array<{ media_type: string; media_url?: string; thumbnail_url?: string }> };
};

const FEED_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink";

export async function getInstagramFeed(limit = 6): Promise<InstagramPost[] | null> {
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!instagramConfigured() || !userId) return null;

  try {
    // Cache de 1h: no tiene sentido pegarle a la API en cada carga de la home.
    const data = await graphGet<{ data?: RawMedia[] }>(
      `${userId}/media`,
      { fields: FEED_FIELDS, limit: String(limit) },
      { next: { revalidate: 3600 } }
    );
    return (data.data ?? [])
      .filter((item) => item.media_type !== "VIDEO" || item.thumbnail_url)
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        caption: item.caption,
        // Un video no tiene media_url usable como imagen — se muestra su miniatura.
        mediaUrl: (item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url) ?? "",
        permalink: item.permalink,
      }));
  } catch (error) {
    console.error("[instagram] getInstagramFeed:", error);
    return null;
  }
}

// Últimas publicaciones con todas sus fotos (los carruseles traen cada imagen;
// de los videos solo se toma la miniatura).
export async function listInstagramMedia(limit = 24): Promise<InstagramMedia[]> {
  const userId = process.env.INSTAGRAM_USER_ID!;
  const data = await graphGet<{ data?: RawMedia[] }>(`${userId}/media`, {
    fields: `${FEED_FIELDS},timestamp,children{media_type,media_url,thumbnail_url}`,
    limit: String(limit),
  });
  return (data.data ?? []).map((item) => {
    const pick = (m: { media_type: string; media_url?: string; thumbnail_url?: string }) =>
      m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
    const images =
      item.media_type === "CAROUSEL_ALBUM"
        ? (item.children?.data ?? []).map(pick)
        : [pick(item)];
    return {
      id: item.id,
      caption: item.caption ?? "",
      permalink: item.permalink,
      timestamp: item.timestamp,
      images: images.filter((u): u is string => Boolean(u)),
    };
  });
}

export async function getInstagramMedia(id: string): Promise<InstagramMedia | null> {
  const list = await listInstagramMedia(50);
  return list.find((m) => m.id === id) ?? null;
}

// Espera a que Instagram termine de procesar un contenedor antes de publicarlo
// (con imágenes suele ser inmediato, pero publicarlo antes de tiempo falla).
async function waitForContainer(id: string): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const { status_code } = await graphGet<{ status_code?: string }>(id, { fields: "status_code" });
    if (status_code === "FINISHED" || !status_code) return;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Instagram no pudo procesar la imagen (${status_code})`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Instagram tardó demasiado en procesar las fotos; intenta de nuevo en unos minutos");
}

// Publica un post (una foto) o carrusel (2 a 10 fotos) y devuelve su link.
// Las fotos deben ser JPEG con URL pública — las del panel (Vercel Blob) lo son.
export async function publishToInstagram(imageUrls: string[], caption: string): Promise<{ id: string; permalink: string }> {
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!instagramConfigured() || !userId) throw new Error("Instagram no está configurado");
  const images = imageUrls.slice(0, 10);
  if (images.length === 0) throw new Error("La propiedad necesita al menos una foto para publicarse en Instagram");

  let creationId: string;
  if (images.length === 1) {
    const { id } = await graphPost<{ id: string }>(`${userId}/media`, { image_url: images[0], caption });
    creationId = id;
  } else {
    const children: string[] = [];
    for (const url of images) {
      const { id } = await graphPost<{ id: string }>(`${userId}/media`, { image_url: url, is_carousel_item: "true" });
      children.push(id);
    }
    for (const child of children) await waitForContainer(child);
    const { id } = await graphPost<{ id: string }>(`${userId}/media`, {
      media_type: "CAROUSEL",
      children: children.join(","),
      caption,
    });
    creationId = id;
  }

  await waitForContainer(creationId);
  const { id } = await graphPost<{ id: string }>(`${userId}/media_publish`, { creation_id: creationId });
  const { permalink } = await graphGet<{ permalink: string }>(id, { fields: "permalink" });
  return { id, permalink };
}

// "https://instagram.com/nailscolor.cl/" -> "@nailscolor.cl"
export function instagramHandle(url: string): string {
  try {
    const handle = new URL(url).pathname.replace(/\//g, "");
    return handle ? `@${handle}` : url;
  } catch {
    return url;
  }
}
