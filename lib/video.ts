// Convierte el link de video de una propiedad en la URL de su reproductor
// embebido. Acepta YouTube (watch / youtu.be / shorts) y reels o posts de
// Instagram — así un video ya publicado en la cuenta se reproduce en la ficha
// sin volver a subirlo a ningún lado.
export interface VideoEmbed {
  src: string;
  provider: "youtube" | "instagram";
  // Reels y shorts son verticales (9:16); el resto, horizontal (16:9).
  vertical: boolean;
}

export function videoEmbed(url: string): VideoEmbed | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt[1]}`, provider: "youtube", vertical: url.includes("/shorts/") };

  const ig = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/);
  if (ig) return { src: `https://www.instagram.com/${ig[1] === "p" ? "p" : "reel"}/${ig[2]}/embed/`, provider: "instagram", vertical: ig[1] !== "p" };

  return null;
}
