import { getSiteConfig } from "@/lib/site-content";
import { OPERATION_LABEL } from "@/components/properties/PropertyCard";
import { getPublicProperties } from "@/lib/public-properties";
import { absoluteUrl } from "@/lib/seo";

// /llms.txt (llmstxt.org): resumen en Markdown del negocio para buscadores y
// asistentes con IA (ChatGPT, Claude, Perplexity). Sale del mismo config e
// inventario que el sitio, así que nunca queda desactualizado respecto de él.
export const revalidate = 3600;

export async function GET() {
  const clientConfig = await getSiteConfig();
  const { meta, seo, services, pricing, faq, contact, about } = clientConfig;
  const properties = await getPublicProperties();

  const lines: string[] = [
    `# ${meta.businessName}`,
    "",
    `> ${seo.description}`,
    "",
    about.body,
    "",
    "## Datos del negocio",
    `- Rubro: ${meta.rubro}`,
    seo.areaServed?.length ? `- Zonas de operación: ${seo.areaServed.join(", ")}` : "",
    contact.phone ? `- Teléfono y WhatsApp: ${contact.phone}` : "",
    contact.email ? `- Email: ${contact.email}` : "",
    contact.address ? `- Ubicación: ${contact.address}` : "",
    contact.hours?.length
      ? `- Horario: ${contact.hours.map((h) => (h.closed ? `${h.day} cerrado` : `${h.day} ${h.open}–${h.close}`)).join("; ")}`
      : "",
    ...(contact.socials ?? []).map((s) => `- ${s.platform[0].toUpperCase() + s.platform.slice(1)}: ${s.url}`),
    `- Sitio web: ${absoluteUrl("/")}`,
    "",
    "## Servicios",
    ...services.map((s) => `- **${s.title}**: ${s.description}`),
  ];

  if (clientConfig.team?.length) {
    lines.push("", `## Equipo (${clientConfig.team.length} personas)`);
    for (const m of clientConfig.team) {
      const contacto = [m.phone && `tel. ${m.phone}`, m.whatsapp && `WhatsApp +${m.whatsapp}`, m.email].filter(Boolean).join(", ");
      lines.push(`- **${m.name}** — ${m.role}${contacto ? ` (${contacto})` : ""}${m.bio ? `. ${m.bio}` : ""}`);
    }
  }

  if (pricing?.length) {
    lines.push("", `## ${clientConfig.branding.pricingLabel}`);
    for (const plan of pricing) lines.push(`- **${plan.name}**: ${plan.price} — incluye: ${plan.features.join("; ")}`);
  }

  if (properties.length) {
    lines.push("", `## Propiedades disponibles (${properties.length})`, `Listado completo con filtros: ${absoluteUrl("/propiedades")}`, "");
    for (const p of properties) {
      const specs = [
        p.bedrooms != null && `${p.bedrooms} dormitorios`,
        p.bathrooms != null && `${p.bathrooms} baños`,
        p.area != null && `${p.area} m²`,
      ].filter(Boolean);
      lines.push(
        `- [${p.title}](${absoluteUrl(`/propiedades/${p.slug}`)}): ${OPERATION_LABEL[p.operation]} en ${p.comuna}, ${p.price}${specs.length ? ` (${specs.join(", ")})` : ""}`
      );
    }
  }

  if (faq?.length) {
    lines.push("", "## Preguntas frecuentes");
    for (const item of faq) lines.push("", `### ${item.q}`, item.a);
  }

  lines.push("", "## Páginas", `- [Inicio](${absoluteUrl("/")})`, `- [Propiedades](${absoluteUrl("/propiedades")})`, `- [Política de privacidad](${absoluteUrl("/privacidad")})`);

  const body = lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).filter((l) => l !== undefined).join("\n") + "\n";
  return new Response(body.replace(/\n{3,}/g, "\n\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
  });
}
