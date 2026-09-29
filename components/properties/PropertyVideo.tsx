import type { VideoEmbed } from "@/lib/video";

// Reproductor del video de una propiedad. Un MP4 propio usa el reproductor
// nativo del navegador (portada = primera foto de la ficha, sin interfaz de
// terceros). YouTube se ve horizontal a todo el ancho; los reels de Instagram
// sin copia propia, con el reproductor oficial de Instagram.
export function PropertyVideo({ video, title, poster }: { video: VideoEmbed; title: string; poster?: string }) {
  if (video.provider === "file") {
    // Caja 9:16 fija (los reels lo son) para que no salte al cargar; un video
    // horizontal se ve completo con franjas negras.
    return (
      <video
        src={video.src}
        poster={poster}
        controls
        playsInline
        preload="none"
        aria-label={`Video de ${title}`}
        className="mx-auto block aspect-[9/16] w-full max-w-[360px] rounded-xl bg-black object-contain"
      />
    );
  }
  if (video.provider === "instagram") {
    return (
      <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-xl border border-foreground/10 bg-white">
        <iframe
          src={video.src}
          title={`Video de ${title}`}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          scrolling="no"
          className="block h-[640px] w-full border-0"
        />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${video.vertical ? "mx-auto aspect-[9/16] max-w-[360px]" : "aspect-video"}`}>
      <iframe
        src={video.src}
        title={`Video de ${title}`}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
