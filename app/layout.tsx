import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/site-content";
import { getFontVariables } from "@/lib/fonts";
import { paletteToCssVars } from "@/lib/theme";
import { buildMetadata, buildLocalBusinessJsonLd, jsonLdString } from "@/lib/seo";
import { REVEAL_SCRIPT } from "@/lib/reveal-script";
import "./globals.css";

// Metadatos y JSON-LD salen del config con lo editado en el panel (CMS).
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getSiteConfig());
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const clientConfig = await getSiteConfig();
  const fontVariables = getFontVariables(clientConfig.branding.fontPairing);
  const jsonLd = buildLocalBusinessJsonLd(clientConfig);

  return (
    <html
      lang={clientConfig.meta.locale}
      className={fontVariables}
      style={paletteToCssVars(clientConfig.branding.palette)}
      // El script de animaciones agrega una clase a <html> antes de hidratar.
      suppressHydrationWarning
    >
      <head>
        {/* Antes del primer pintado: deja listas las animaciones de entrada sin esperar a React. */}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
        />
      </body>
    </html>
  );
}
