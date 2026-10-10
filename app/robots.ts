import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Paneles, APIs, variantes de diseño y el widget embebible no son contenido
// para buscadores. Los bots de búsqueda con IA (ChatGPT, Claude, Perplexity,
// Gemini) quedan explícitamente permitidos: bloquearlos impide que citen el
// sitio en sus respuestas.
const PRIVATE = ["/api/", "/admin", "/opina", "/inmobiliaria/", "/agenda/admin", "/tienda/admin", "/embed/", "/variantes"];
const AI_SEARCH_BOTS = ["OAI-SearchBot", "ChatGPT-User", "GPTBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_SEARCH_BOTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
