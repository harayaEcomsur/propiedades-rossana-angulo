import type { CSSProperties } from "react";
import type { ClientConfig } from "@/config/schema";

export function paletteToCssVars(palette: ClientConfig["branding"]["palette"]): CSSProperties {
  return {
    "--color-primary": palette.primary,
    "--color-accent": palette.accent,
    "--color-background": palette.background,
    "--color-foreground": palette.foreground,
  } as CSSProperties;
}
