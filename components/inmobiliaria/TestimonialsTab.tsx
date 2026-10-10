"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, Star, Trash2, X } from "lucide-react";

// Pestaña "Testimonios" (administración): link y QR de /opina para compartir
// con clientes, y moderación. Nada se publica sin "Aprobar".

interface T {
  id: string;
  name: string;
  email: string;
  rating: number;
  quote: string;
  status: "pendiente" | "aprobado" | "rechazado";
  createdAt: string;
}

const card = "rounded-xl border border-foreground/15 p-4 sm:p-5";
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-foreground/20 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-40";
const input = "w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm";

function Stars({ n }: { n: number }) {
  return (
    <span role="img" aria-label={`${n} de 5`} className="inline-flex text-primary">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} fill={i <= n ? "currentColor" : "none"} aria-hidden />
      ))}
    </span>
  );
}

export function TestimonialsTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [items, setItems] = useState<T[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/opina` : "/opina";

  async function load() {
    const res = await fetch("/api/inmobiliaria/testimonios", { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) setErr(data.error ?? "No se pudieron cargar");
    else setItems(data.testimonials);
  }

  useEffect(() => {
    load();
    QRCode.toDataURL(`${window.location.origin}/opina`, { width: 600, margin: 2, color: { dark: "#1F1F1F", light: "#FFFFFF" } }).then(setQr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(method: "PATCH" | "DELETE", body: unknown) {
    setErr(null);
    const res = await fetch("/api/inmobiliaria/testimonios", { method, headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) setErr(data.error ?? "Error");
    load();
  }

  const pending = items?.filter((t) => t.status === "pendiente") ?? [];
  const approved = items?.filter((t) => t.status === "aprobado") ?? [];
  const rejected = items?.filter((t) => t.status === "rechazado") ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className={`${card} grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center`}>
        <div>
          <h3 className="font-semibold">Pedir testimonios a clientes</h3>
          <p className="mt-1 text-sm text-foreground/65">
            Comparte este link o el QR (por WhatsApp, en la entrega de llaves, impreso). La página no aparece en Google ni en el
            menú del sitio. Cada testimonio te llega por correo y queda aquí para que lo apruebes.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded bg-foreground/5 px-2 py-1 text-sm">{link}</code>
            <button
              className={btn}
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Copy size={13} /> {copied ? "Copiado" : "Copiar link"}
            </button>
            {qr && (
              <a className={btn} href={qr} download="qr-testimonios.png">
                <Download size={13} /> Descargar QR
              </a>
            )}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr && <img src={qr} alt="Código QR para dejar un testimonio" className="h-32 w-32 justify-self-center rounded-lg border border-foreground/10" />}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {!items && !err && <p className="text-sm text-foreground/60">Cargando…</p>}

      {items && (
        <>
          <div className={card}>
            <h3 className="mb-3 font-semibold">Por revisar ({pending.length})</h3>
            {pending.length === 0 && <p className="text-sm text-foreground/50">No hay testimonios pendientes.</p>}
            <div className="flex flex-col gap-3">
              {pending.map((t) => (
                <PendingItem key={t.id} t={t} onAct={act} />
              ))}
            </div>
          </div>

          <div className={card}>
            <h3 className="mb-1 font-semibold">Publicados en el sitio ({approved.length})</h3>
            <p className="mb-3 text-xs text-foreground/55">
              Con al menos uno publicado, la sección de testimonios del sitio muestra solo estos (reemplaza a los de ejemplo).
            </p>
            {approved.length === 0 && <p className="text-sm text-foreground/50">Todavía no hay testimonios publicados.</p>}
            <ul className="flex flex-col gap-2">
              {approved.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-foreground/10 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {t.name} <Stars n={t.rating} />
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">“{t.quote}”</p>
                  </div>
                  <button className={btn} onClick={() => act("PATCH", { id: t.id, status: "pendiente" })}>
                    Despublicar
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {rejected.length > 0 && (
            <details className={card}>
              <summary className="cursor-pointer font-semibold">Rechazados ({rejected.length})</summary>
              <ul className="mt-3 flex flex-col gap-2">
                {rejected.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-foreground/10 p-3 opacity-75">
                    <p className="text-sm">
                      <strong>{t.name}</strong> — “{t.quote.slice(0, 120)}
                      {t.quote.length > 120 ? "…" : ""}”
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <button className={btn} onClick={() => act("PATCH", { id: t.id, status: "pendiente" })}>
                        Recuperar
                      </button>
                      <button
                        className={btn}
                        aria-label="Eliminar definitivamente"
                        onClick={() => {
                          if (confirm("¿Eliminar este testimonio definitivamente?")) act("DELETE", { id: t.id });
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function PendingItem({ t, onAct }: { t: T; onAct: (m: "PATCH" | "DELETE", b: unknown) => void }) {
  const [name, setName] = useState(t.name);
  const [quote, setQuote] = useState(t.quote);
  const edited = name !== t.name || quote !== t.quote;
  return (
    <div className="rounded-lg border border-foreground/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/55">
        <span>
          <Stars n={t.rating} /> · {t.email} · {new Date(t.createdAt).toLocaleDateString("es-CL")}
        </span>
      </div>
      <div className="mt-2 grid gap-2">
        <label className="text-xs font-medium text-foreground/60">
          Nombre a publicar (puedes abreviarlo, ej. &quot;Carolina R.&quot;)
          <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-xs font-medium text-foreground/60">
          Testimonio (corrige solo errores de tipeo; no cambies lo que dijo)
          <textarea className={`${input} mt-1`} rows={3} value={quote} onChange={(e) => setQuote(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
          onClick={() => onAct("PATCH", { id: t.id, status: "aprobado", ...(edited ? { name, quote } : {}) })}
        >
          <Check size={13} /> Aprobar y publicar
        </button>
        <button className={btn} onClick={() => onAct("PATCH", { id: t.id, status: "rechazado" })}>
          <X size={13} /> Rechazar
        </button>
      </div>
    </div>
  );
}
