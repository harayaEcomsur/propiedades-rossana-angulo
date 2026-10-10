import { clientConfig } from "@/config/client.config";
import { getPublicProperties } from "@/lib/public-properties";

// Mínimo de propiedades para publicar la página de una comuna: con menos,
// Google la ve como contenido pobre y conviene no indexarla.
export const MIN_COMUNA_PROPERTIES = 3;

export async function getComunaPages() {
  const properties = await getPublicProperties();
  return (clientConfig.comunaPages ?? [])
    .map((c) => ({ ...c, properties: properties.filter((p) => p.comuna === c.name) }))
    .filter((c) => c.properties.length >= MIN_COMUNA_PROPERTIES);
}
