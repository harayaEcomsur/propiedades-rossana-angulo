// Eventos de Google Analytics 4. Sin NEXT_PUBLIC_GA_ID no se carga gtag y
// track() no hace nada, así que se puede llamar desde cualquier componente.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type Params = Record<string, string | number | boolean | undefined | object[]>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    gaQueue?: [string, Params][];
  }
}

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined" || !GA_ID) return;
  // Eventos anteriores a la carga de gtag (ej. view_item al hidratar la ficha)
  // quedan en cola; el script de GoogleAnalytics los envía tras el config.
  if (window.gtag) window.gtag("event", event, params);
  else (window.gaQueue ??= []).push([event, params]);
}

// Datos de la propiedad que se está viendo, si la página es una ficha
// (ver data-property-* en app/propiedades/[slug]/page.tsx).
export function currentProperty(): Params {
  const el = document.querySelector<HTMLElement>("[data-property-id]");
  if (!el) return {};
  return { property_id: el.dataset.propertyId, property_title: el.dataset.propertyTitle };
}
