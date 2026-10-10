"use client";

import { useState } from "react";
import { Star } from "lucide-react";

// Formulario de testimonio para clientes (página /opina, se comparte por QR o
// link). Pensado para celular: campos grandes, estrellas de 44px.
export function TestimonialForm({ businessName }: { businessName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) {
      setStatus("error");
      setError("Elige cuántas estrellas nos das.");
      return;
    }
    setStatus("sending");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/testimonios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          quote: String(data.get("quote") ?? ""),
          website: String(data.get("website") ?? ""),
          rating,
          consent,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "No se pudo enviar");
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "No se pudo enviar. Revisa tu conexión.");
    }
  }

  if (status === "ok") {
    return (
      <div className="bg-primary/10 p-6 text-center">
        <p className="font-heading text-2xl font-semibold text-foreground">¡Muchas gracias!</p>
        <p className="mt-2 text-foreground/75">Recibimos tu testimonio. Lo revisaremos antes de publicarlo en el sitio.</p>
      </div>
    );
  }

  const input = "min-h-12 w-full border border-black/15 bg-white px-3 py-2 text-base text-foreground focus:border-primary focus:outline-none";
  const shown = hover || rating;

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-foreground">¿Cómo evaluarías tu experiencia con {businessName}?</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              aria-pressed={rating === n}
              className="flex h-12 w-12 items-center justify-center text-primary"
            >
              <Star size={32} fill={n <= shown ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="t-name" className="mb-1 block text-sm font-medium text-foreground">
          Tu nombre <span className="font-normal text-foreground/55">(así aparecerá publicado)</span>
        </label>
        <input id="t-name" name="name" required maxLength={80} autoComplete="name" className={input} />
      </div>
      <div>
        <label htmlFor="t-email" className="mb-1 block text-sm font-medium text-foreground">
          Correo <span className="font-normal text-foreground/55">(no se publica)</span>
        </label>
        <input id="t-email" name="email" type="email" required autoComplete="email" className={input} />
      </div>
      <div>
        <label htmlFor="t-quote" className="mb-1 block text-sm font-medium text-foreground">
          Tu testimonio
        </label>
        <textarea id="t-quote" name="quote" required minLength={15} maxLength={800} rows={5} className={`${input} min-h-32`} />
      </div>
      {/* Campo trampa anti-bots: oculto para personas. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="t-website">No completar</label>
        <input id="t-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-2 text-sm text-foreground/75">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-0.5 h-5 w-5 shrink-0" />
        <span>
          Autorizo a {businessName} a publicar mi nombre, evaluación y testimonio en su sitio web, según la{" "}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            política de privacidad
          </a>
          .
        </span>
      </label>
      <button
        type="submit"
        disabled={status === "sending" || !consent}
        className="min-h-12 w-full bg-primary px-6 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-60"
      >
        {status === "sending" ? "Enviando…" : "Enviar testimonio"}
      </button>
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
