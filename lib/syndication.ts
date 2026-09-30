import type { ClientConfig } from "@/config/schema";

// Canales donde se publica cada propiedad, para el texto "se publica también
// en…". Solo nombra portales con integración real; `otherPortals` agrega una
// mención genérica ("otros portales inmobiliarios") sin nombrar ninguno.
export function syndicationChannels(syndication: ClientConfig["syndication"]): string[] {
  return [
    syndication?.instagram && "Instagram",
    syndication?.tiktok && "TikTok",
    syndication?.portalinmobiliario && "Portalinmobiliario",
    syndication?.otherPortals && "otros portales inmobiliarios",
  ].filter(Boolean) as string[];
}

// ["Instagram", "otros portales"] → "Instagram y otros portales"
export function joinChannels(channels: string[]): string {
  return channels.length <= 1 ? (channels[0] ?? "") : `${channels.slice(0, -1).join(", ")} y ${channels.at(-1)}`;
}
