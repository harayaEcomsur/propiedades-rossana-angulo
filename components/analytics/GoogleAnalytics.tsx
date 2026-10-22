"use client";

import Script from "next/script";
import { useEffect } from "react";
import { GA_ID, currentProperty, track } from "@/lib/analytics";

// Carga GA4 y registra, con un solo listener, los clics que son contactos:
// WhatsApp, teléfono, correo e Instagram, más la apertura de una ficha desde
// una lista y la reproducción de videos. Así los botones no necesitan código
// propio: basta con que sean enlaces normales. `data-track-location` en el
// enlace o un contenedor indica desde dónde se hizo el clic (ficha, flotante…).
// Las vistas de página (incluida la navegación interna) las mide GA4 solo.
export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_ID) return;

    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const location =
        a.closest<HTMLElement>("[data-track-location]")?.dataset.trackLocation ??
        (a.closest("header") ? "menu" : a.closest("footer") ? "pie" : "pagina");
      const base = { link_location: location, page_path: window.location.pathname, ...currentProperty() };

      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//.test(href)) track("whatsapp_click", base);
      else if (href.startsWith("tel:")) track("phone_click", base);
      else if (href.startsWith("mailto:")) track("email_click", base);
      else if (/instagram\.com\//.test(href)) track("instagram_click", base);
      else {
        const m = href.match(/^\/propiedades\/([^/?#]+)/);
        if (m && !window.location.pathname.startsWith(`/propiedades/${m[1]}`)) {
          const list = a.closest<HTMLElement>("[data-item-list]")?.dataset.itemList ?? window.location.pathname;
          track("select_item", { item_list_name: list, items: [{ item_id: m[1] }] });
        }
      }
    }

    // `play` no burbujea: se escucha en fase de captura.
    function onPlay(e: Event) {
      if (e.target instanceof HTMLVideoElement) track("video_start", { page_path: window.location.pathname, ...currentProperty() });
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("play", onPlay, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("play", onPlay, true);
    };
  }, []);

  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');(window.gaQueue||[]).forEach(function(e){gtag('event',e[0],e[1])});window.gaQueue=[];`}
      </Script>
    </>
  );
}

// Vista de una ficha (evento recomendado de GA4 view_item).
export function TrackPropertyView({ item }: { item: Record<string, string | number | undefined> }) {
  useEffect(() => {
    track("view_item", { items: [item] });
  }, [item.item_id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
