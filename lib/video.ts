// Convierte el link de video de una propiedad en lo que necesita su
// reproductor. Acepta:
//  - un MP4 propio (el reel copiado a Vercel Blob al importar desde Instagram,
//    o cualquier .mp4/.webm/.mov público): reproductor nativo del sitio;
//  - YouTube (watch / youtu.be / shorts) y reels o posts de Instagram: su
//    reproductor embebido.
export interface VideoEmbed {
  src: string;
  provider: "file" | "youtube" | "instagram";
  // Va en la columna lateral (reels, shorts y archivos propios, que en la
  // práctica son reels copiados) o a todo el ancho bajo la galería.
  vertical: boolean;
}

export function videoEmbed(url: string): VideoEmbed | null {
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return { src: url, provider: "file", vertical: true };

  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt[1]}`, provider: "youtube", vertical: url.includes("/shorts/") };

  const ig = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/);
  if (ig) return { src: `https://www.instagram.com/${ig[1] === "p" ? "p" : "reel"}/${ig[2]}/embed/`, provider: "instagram", vertical: ig[1] !== "p" };

  return null;
}
