import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientConfig } from "@/config/client.config";
import { currentBroker } from "@/lib/realestate-auth";
import { listProperties, setPropertyInstagram } from "@/lib/realestate-store";
import { getInstagramMedia, instagramConfigured, listInstagramMedia, publishToInstagram } from "@/lib/instagram";
import { captionForProperty, draftFromCaption } from "@/lib/instagram-property";

// Puente entre el panel /inmobiliaria/admin e Instagram:
//  GET            → últimas publicaciones de la cuenta, para elegir cuál importar.
//  POST import    → copia las fotos (y el video, si es un reel) de una
//                   publicación a Vercel Blob (las URLs de Instagram vencen en
//                   días) y devuelve un borrador de ficha leído del texto,
//                   para prellenar el formulario.
//  POST publish   → publica una propiedad del panel en Instagram (carrusel).
export const runtime = "nodejs";
// Publicar un carrusel son varias llamadas a Instagram en serie, y copiar un
// reel a Blob puede tomar varios segundos.
export const maxDuration = 120;

// Un reel dura a lo más 90 s: unos pocos MB a decenas. Este tope solo evita
// copiar algo anómalo.
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

// Copia el MP4 de un reel a Vercel Blob en streaming (sin cargarlo entero en
// memoria). Si falla, la importación sigue sin video propio: la ficha cae al
// reproductor de Instagram usando el link del reel.
async function copyVideo(url: string, pathname: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    const size = Number(res.headers.get("content-length") ?? 0);
    if (!res.ok || !res.body || size > MAX_VIDEO_BYTES) return undefined;
    const blob = await put(pathname, res.body, {
      access: "public",
      contentType: res.headers.get("content-type") ?? "video/mp4",
      addRandomSuffix: true,
      multipart: true,
    });
    return blob.url;
  } catch (error) {
    console.error("[instagram] no se pudo copiar el video:", error);
    return undefined;
  }
}

function claveFromRequest(req: Request): string | null {
  return req.headers.get("x-re-key") ?? new URL(req.url).searchParams.get("clave");
}

async function authorize(req: Request) {
  if (!clientConfig.modules.inmobiliariaAdmin) return { error: Response.json({ error: "No habilitado" }, { status: 404 }) };
  const broker = await currentBroker(claveFromRequest(req));
  if (!broker) return { error: Response.json({ error: "No autorizado" }, { status: 401 }) };
  if (!instagramConfigured()) {
    return { error: Response.json({ error: "Instagram no está conectado en este sitio (faltan INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID)." }, { status: 503 }) };
  }
  return { broker };
}

export async function GET(req: Request) {
  const auth = await authorize(req);
  if (auth.error) return auth.error;

  try {
    const [media, properties] = await Promise.all([listInstagramMedia(24), listProperties()]);
    const linked = new Set(properties.map((p) => p.instagramMediaId).filter(Boolean));
    return Response.json({
      posts: media
        .filter((m) => m.images.length > 0)
        .map((m) => ({ ...m, alreadyLinked: linked.has(m.id) })),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Error al leer Instagram" }, { status: 502 });
  }
}

const postSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("import"), mediaId: z.string().min(1) }),
  z.object({ kind: z.literal("publish"), propertyId: z.string().min(1) }),
]);

export async function POST(req: Request) {
  const auth = await authorize(req);
  if (auth.error) return auth.error;
  const { broker } = auth;

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 400 });
  const data = parsed.data;

  if (data.kind === "import") {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json({ error: "La subida de fotos no está configurada en este sitio (falta Vercel Blob)." }, { status: 503 });
    }
    const media = await getInstagramMedia(data.mediaId).catch(() => null);
    if (!media) return Response.json({ error: "No se encontró la publicación en Instagram" }, { status: 404 });

    const photos: string[] = [];
    for (const [i, url] of media.images.slice(0, 20).entries()) {
      const res = await fetch(url);
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const pathname = `inmobiliaria/${clientConfig.meta.slug}/${broker.id}/ig-${media.id}-${i}.${ext}`;
      const blob = await put(pathname, await res.blob(), { access: "public", contentType, addRandomSuffix: true });
      photos.push(blob.url);
    }
    if (photos.length === 0) return Response.json({ error: "No se pudieron descargar las fotos de la publicación" }, { status: 502 });

    return Response.json({
      ok: true,
      draft: draftFromCaption(media.caption),
      photos,
      video: media.videoUrl ? await copyVideo(media.videoUrl, `inmobiliaria/${clientConfig.meta.slug}/${broker.id}/ig-${media.id}.mp4`) : undefined,
      instagramMediaId: media.id,
      instagramUrl: media.permalink,
    });
  }

  // kind === "publish": la corredora dueña de la propiedad, o la admin.
  const property = (await listProperties()).find((p) => p.id === data.propertyId);
  if (!property) return Response.json({ error: "Propiedad no encontrada" }, { status: 404 });
  if (broker.role !== "admin" && property.brokerId !== broker.id) return Response.json({ error: "No autorizado" }, { status: 403 });
  if (property.instagramUrl) return Response.json({ error: "Esta propiedad ya está en Instagram", url: property.instagramUrl }, { status: 409 });

  try {
    const { id, permalink } = await publishToInstagram(property.photos, captionForProperty(property));
    await setPropertyInstagram(property.id, { mediaId: id, url: permalink });
    revalidatePath("/", "layout");
    return Response.json({ ok: true, url: permalink });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo publicar en Instagram" }, { status: 502 });
  }
}
