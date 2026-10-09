import type { MetadataRoute } from "next";
import { clientConfig } from "@/config/client.config";
import { getPublicProperties } from "@/lib/public-properties";
import { absoluteUrl } from "@/lib/seo";
import { listProviders } from "@/lib/realestate-store";

// Solo URLs públicas e indexables (con su canonical). Las fichas salen del
// mismo inventario que ve el público, así que una propiedad nueva del panel
// entra sola al sitemap. Quedan fuera paneles, variantes de diseño y /embed.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];

  const properties = await getPublicProperties();
  if (properties.length > 0) {
    entries.push({ url: absoluteUrl("/propiedades"), lastModified: now, changeFrequency: "daily", priority: 0.9 });
    for (const p of properties) {
      entries.push({
        url: absoluteUrl(`/propiedades/${p.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Solo si tiene contenido (ver la misma regla en app/proveedores/page.tsx).
  if (clientConfig.modules.inmobiliariaAdmin && (await listProviders()).length > 0) {
    entries.push({ url: absoluteUrl("/proveedores"), lastModified: now, changeFrequency: "monthly", priority: 0.4 });
  }
  entries.push({ url: absoluteUrl("/privacidad"), lastModified: now, changeFrequency: "yearly", priority: 0.2 });
  return entries;
}
