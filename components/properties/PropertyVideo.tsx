import type { VideoEmbed } from "@/lib/video";

// Reproductor del video de una propiedad. YouTube se ve horizontal a todo el
// ancho; los reels de Instagram, verticales, con el reproductor oficial de
// Instagram (miniatura + play, se reproduce ahí mismo sin salir del sitio).
export function PropertyVideo({ video, title }: { video: VideoEmbed; title: string }) {
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
