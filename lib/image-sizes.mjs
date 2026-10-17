// Anchos que pide next/image (next.config.mjs → deviceSizes + imageSizes) y
// que existen como variante optimizada: el script de imágenes locales los
// genera y /api/img solo acepta estos. Pocos anchos = menos variantes que
// procesar y mejor tasa de acierto en la caché de la CDN.
// 750 = iPhone de 375 px con pantalla doble (la mayoría de los celulares).
export const DEVICE_SIZES = [640, 750, 828, 1080, 1280, 1920];
export const IMAGE_SIZES = [128, 256, 384];
export const ALL_WIDTHS = [...IMAGE_SIZES, ...DEVICE_SIZES];
