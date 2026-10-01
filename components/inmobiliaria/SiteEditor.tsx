"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { resizeImage } from "@/components/inmobiliaria/PhotoUploader";

// Pestaña "Sitio" del panel (solo administradoras): CMS de los textos e
// imágenes de la web pública. Cada sección se guarda por separado y se publica
// al instante; "Volver al original" descarta lo editado en esa sección.

const card = "rounded-xl border border-foreground/15 p-4 sm:p-5";
const input = "w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm";
const btnPrimary = "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-1.5 rounded-lg border border-foreground/20 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-40";

// Íconos ofrecidos para pilares y servicios (nombres de lucide-react).
const ICONS = ["Home", "KeyRound", "CalendarDays", "TrendingUp", "FileCheck", "Megaphone", "Handshake", "Award", "Scale", "Ruler", "MapPin", "ShieldCheck", "Building2", "Camera", "Users", "Star"];

type Json = Record<string, unknown>;
interface Content {
  hero: { title: string; subtitle: string; ctaLabel: string; ctaHref: string; backgroundImageUrl?: string; backgroundImageCredit?: { text: string; href: string }; badges?: string[] };
  pillars: { icon: string; title: string; text: string }[];
  services: { icon: string; title: string; description: string; price?: string }[];
  about: { title: string; body: string; imageUrl?: string };
  team: { name: string; role: string; photoUrl?: string; bio?: string; phone?: string; whatsapp?: string; email?: string }[];
  testimonials: { name: string; quote: string; rating?: number }[];
  faq: { q: string; a: string }[];
  pricing: { name: string; price: string; features: string[]; highlighted?: boolean }[];
  contact: {
    phone?: string;
    whatsapp?: string;
    whatsappPrefilledMessage?: string;
    email?: string;
    address?: string;
    mapQuery?: string;
    hours?: { day: string; open?: string; close?: string; closed?: boolean }[];
    socials?: { platform: string; url: string }[];
  };
  seo: { title: string; description: string };
  titles: { sections: Record<string, Record<string, string>>; nav: Record<string, string> };
}
type Section = keyof Content;

const SECTIONS: { id: Section; label: string; anchor?: string }[] = [
  { id: "hero", label: "Portada", anchor: "/" },
  { id: "pillars", label: "Pilares", anchor: "/" },
  { id: "services", label: "Servicios", anchor: "/#servicios" },
  { id: "about", label: "Nosotros", anchor: "/#nosotros" },
  { id: "titles", label: "Títulos y menú", anchor: "/" },
  { id: "testimonials", label: "Testimonios", anchor: "/" },
  { id: "faq", label: "Preguntas frecuentes", anchor: "/#preguntas-frecuentes" },
  { id: "pricing", label: "Valores", anchor: "/#valores" },
  { id: "contact", label: "Contacto", anchor: "/#contacto" },
  { id: "seo", label: "Google (SEO)" },
];

// Quita strings vacíos / objetos vacíos para que lo opcional quede "sin dato"
// en vez de "" (el esquema valida emails/URLs y "" no pasaría).
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== "" && v !== undefined) as T;
  if (value && typeof value === "object") {
    const out: Json = {};
    for (const [k, v] of Object.entries(value as Json)) {
      const c = clean(v);
      if (c === "" || c === undefined) continue;
      if (c && typeof c === "object" && !Array.isArray(c) && Object.keys(c).length === 0) continue;
      out[k] = c;
    }
    return out as T;
  }
  return value;
}

export function SiteEditor({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [content, setContent] = useState<Content | null>(null);
  const [edited, setEdited] = useState<string[]>([]);
  const [section, setSection] = useState<Section>("hero");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function load() {
    const res = await fetch("/api/inmobiliaria/sitio", { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) {
      setStatus({ kind: "error", text: data.error ?? "No se pudo cargar el contenido" });
      return;
    }
    setContent(data.content);
    setEdited(data.edited);
    setDirty(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<S extends Section>(s: S, value: Content[S]) {
    setContent((c) => (c ? { ...c, [s]: value } : c));
    setDirty(true);
    setStatus(null);
  }

  async function save(value: unknown | null) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/inmobiliaria/sitio", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ section, value: value === null ? null : clean(value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar");
      await load();
      setStatus({ kind: "ok", text: value === null ? "Sección devuelta al texto original." : "Guardado y publicado en el sitio." });
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  if (!content) return <p className="text-sm text-foreground/60">{status?.text ?? "Cargando contenido del sitio…"}</p>;
  const current = SECTIONS.find((s) => s.id === section)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Secciones del sitio">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              if (dirty && !confirm("Hay cambios sin guardar en esta sección. ¿Descartarlos?")) return;
              if (dirty) load();
              setSection(s.id);
              setStatus(null);
            }}
            className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition ${
              section === s.id ? "bg-primary font-semibold text-white" : "bg-foreground/5 text-foreground/75 hover:bg-foreground/10"
            }`}
          >
            {s.label}
            {edited.includes(s.id) && <span className="ml-1.5 text-[10px] uppercase opacity-70">· editado</span>}
          </button>
        ))}
      </nav>

      <div className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{current.label}</h3>
          {current.anchor && (
            <a href={current.anchor} target="_blank" rel="noopener noreferrer" className={btnGhost}>
              <ExternalLink size={13} /> Ver en el sitio
            </a>
          )}
        </div>

        {section === "hero" && <HeroForm value={content.hero} onChange={(v) => update("hero", v)} authHeaders={authHeaders} />}
        {section === "pillars" && (
          <ListEditor
            items={content.pillars}
            onChange={(v) => update("pillars", v)}
            max={4}
            empty={{ icon: "Award", title: "", text: "" }}
            itemLabel={(p) => p.title || "Nuevo pilar"}
            render={(p, set) => (
              <>
                <IconSelect value={p.icon} onChange={(icon) => set({ ...p, icon })} />
                <Field label="Título" value={p.title} onChange={(title) => set({ ...p, title })} />
                <Field label="Texto" value={p.text} onChange={(text) => set({ ...p, text })} multiline />
              </>
            )}
          />
        )}
        {section === "services" && (
          <ListEditor
            items={content.services}
            onChange={(v) => update("services", v)}
            max={12}
            empty={{ icon: "Home", title: "", description: "" }}
            itemLabel={(s) => s.title || "Nuevo servicio"}
            render={(s, set) => (
              <>
                <IconSelect value={s.icon} onChange={(icon) => set({ ...s, icon })} />
                <Field label="Título" value={s.title} onChange={(title) => set({ ...s, title })} />
                <Field label="Descripción" value={s.description} onChange={(description) => set({ ...s, description })} multiline />
                <Field label="Precio (opcional)" value={s.price ?? ""} onChange={(price) => set({ ...s, price })} />
              </>
            )}
          />
        )}
        {section === "about" && (
          <div className="space-y-3">
            <Field label="Título" value={content.about.title} onChange={(title) => update("about", { ...content.about, title })} />
            <Field label="Texto" value={content.about.body} onChange={(body) => update("about", { ...content.about, body })} multiline rows={8} />
            <ImageField label="Imagen" value={content.about.imageUrl} onChange={(imageUrl) => update("about", { ...content.about, imageUrl })} authHeaders={authHeaders} />
          </div>
        )}
        {section === "titles" && <TitlesForm value={content.titles} onChange={(v) => update("titles", v)} />}
        {section === "testimonials" && (
          <ListEditor
            items={content.testimonials}
            onChange={(v) => update("testimonials", v)}
            max={12}
            empty={{ name: "", quote: "", rating: 5 }}
            itemLabel={(t) => t.name || "Nuevo testimonio"}
            render={(t, set) => (
              <>
                <Field label="Nombre del cliente" value={t.name} onChange={(name) => set({ ...t, name })} />
                <Field label="Testimonio" value={t.quote} onChange={(quote) => set({ ...t, quote })} multiline />
                <label className="block text-xs font-medium text-foreground/60">
                  Estrellas
                  <select className={`${input} mt-1`} value={t.rating ?? 5} onChange={(e) => set({ ...t, rating: Number(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          />
        )}
        {section === "faq" && (
          <ListEditor
            items={content.faq}
            onChange={(v) => update("faq", v)}
            max={30}
            empty={{ q: "", a: "" }}
            itemLabel={(f) => f.q || "Nueva pregunta"}
            render={(f, set) => (
              <>
                <Field label="Pregunta" value={f.q} onChange={(q) => set({ ...f, q })} />
                <Field label="Respuesta" value={f.a} onChange={(a) => set({ ...f, a })} multiline />
              </>
            )}
          />
        )}
        {section === "pricing" && (
          <ListEditor
            items={content.pricing}
            onChange={(v) => update("pricing", v)}
            max={6}
            empty={{ name: "", price: "", features: [] }}
            itemLabel={(p) => p.name || "Nuevo valor"}
            render={(p, set) => (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre" value={p.name} onChange={(name) => set({ ...p, name })} />
                  <Field label="Valor" value={p.price} onChange={(price) => set({ ...p, price })} placeholder="2% + IVA" />
                </div>
                <StringList label="Qué incluye" items={p.features} onChange={(features) => set({ ...p, features })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(p.highlighted)} onChange={(e) => set({ ...p, highlighted: e.target.checked })} />
                  Destacar (fondo negro)
                </label>
              </>
            )}
          />
        )}
        {section === "contact" && <ContactForm value={content.contact} onChange={(v) => update("contact", v)} />}
        {section === "seo" && (
          <div className="space-y-3">
            <p className="text-xs text-foreground/60">Es lo que muestra Google en los resultados de búsqueda de la página de inicio.</p>
            <Field label={`Título (${content.seo.title.length}/60 recomendado)`} value={content.seo.title} onChange={(title) => update("seo", { ...content.seo, title })} />
            <Field
              label={`Descripción (${content.seo.description.length}/155 recomendado)`}
              value={content.seo.description}
              onChange={(description) => update("seo", { ...content.seo, description })}
              multiline
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-4">
          <button className={btnPrimary} disabled={busy || !dirty} onClick={() => save(content[section])}>
            {busy ? "Guardando…" : "Guardar y publicar"}
          </button>
          {dirty && (
            <button className={btnGhost} disabled={busy} onClick={() => load()}>
              Descartar cambios
            </button>
          )}
          {edited.includes(section) && (
            <button
              className={btnGhost}
              disabled={busy}
              onClick={() => {
                if (confirm("¿Volver esta sección al texto original? Se pierde lo editado.")) save(null);
              }}
            >
              <RotateCcw size={13} /> Volver al original
            </button>
          )}
          {status && <p className={`text-sm ${status.kind === "ok" ? "text-green-700" : "text-red-600"}`}>{status.text}</p>}
        </div>
      </div>
    </div>
  );
}

// ---------- Campos ----------

function Field({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-medium text-foreground/60">
      {label}
      {multiline ? (
        <textarea className={`${input} mt-1 text-foreground`} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={`${input} mt-1 text-foreground`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = ICONS.includes(value) ? ICONS : [value, ...ICONS];
  return (
    <label className="block text-xs font-medium text-foreground/60">
      Ícono
      <select className={`${input} mt-1 text-foreground`} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </label>
  );
}

function StringList({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground/60">{label}</p>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input className={input} value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button className={btnGhost} aria-label="Quitar" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button className={btnGhost} onClick={() => onChange([...items, ""])}>
        <Plus size={13} /> Agregar
      </button>
    </div>
  );
}

export function ImageField({
  label,
  value,
  onChange,
  authHeaders,
  round,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  authHeaders: Record<string, string>;
  round?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append("file", await resizeImage(file, 2000, 0.82), "imagen.jpg");
      const res = await fetch("/api/inmobiliaria/upload", { method: "POST", headers: authHeaders, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir la imagen");
      onChange(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-foreground/60">{label}</p>
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={`h-20 w-20 object-cover ${round ? "rounded-full" : "rounded-lg"}`} />
        ) : (
          <div className={`flex h-20 w-20 items-center justify-center bg-foreground/5 text-foreground/40 ${round ? "rounded-full" : "rounded-lg"}`}>
            <ImagePlus size={20} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button className={btnGhost} disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? "Subiendo…" : value ? "Cambiar" : "Subir imagen"}
          </button>
          {value && (
            <button className={btnGhost} disabled={busy} onClick={() => onChange(undefined)}>
              Quitar
            </button>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

function ListEditor<T>({
  items,
  onChange,
  empty,
  max,
  itemLabel,
  render,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  empty: T;
  max: number;
  itemLabel: (item: T) => string;
  render: (item: T, set: (v: T) => void) => React.ReactNode;
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <details key={i} className="rounded-lg border border-foreground/10 p-3" open={items.length <= 2}>
          <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium">
            <span className="truncate">
              {i + 1}. {itemLabel(item)}
            </span>
            <span className="flex shrink-0 gap-1" onClick={(e) => e.preventDefault()}>
              <button className={btnGhost} aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp size={13} />
              </button>
              <button className={btnGhost} aria-label="Bajar" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown size={13} />
              </button>
              <button
                className={btnGhost}
                aria-label="Eliminar"
                onClick={() => {
                  if (confirm(`¿Eliminar "${itemLabel(item)}"?`)) onChange(items.filter((_, j) => j !== i));
                }}
              >
                <Trash2 size={13} />
              </button>
            </span>
          </summary>
          <div className="mt-3 space-y-3">{render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))))}</div>
        </details>
      ))}
      {items.length < max && (
        <button className={btnGhost} onClick={() => onChange([...items, empty])}>
          <Plus size={13} /> Agregar
        </button>
      )}
    </div>
  );
}

function HeroForm({ value, onChange, authHeaders }: { value: Content["hero"]; onChange: (v: Content["hero"]) => void; authHeaders: Record<string, string> }) {
  return (
    <div className="space-y-3">
      <Field label="Título principal" value={value.title} onChange={(title) => onChange({ ...value, title })} />
      <Field label="Subtítulo" value={value.subtitle} onChange={(subtitle) => onChange({ ...value, subtitle })} multiline />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Texto del botón" value={value.ctaLabel} onChange={(ctaLabel) => onChange({ ...value, ctaLabel })} />
        <Field label="Enlace del botón" value={value.ctaHref} onChange={(ctaHref) => onChange({ ...value, ctaHref })} placeholder="#contacto" />
      </div>
      <StringList label="Sellos bajo el subtítulo (máx. 4)" items={value.badges ?? []} onChange={(badges) => onChange({ ...value, badges: badges.slice(0, 4) })} />
      <ImageField
        label="Imagen de fondo (horizontal, ideal 2400 px de ancho)"
        value={value.backgroundImageUrl}
        onChange={(backgroundImageUrl) =>
          // Una imagen nueva ya no es la de Wikimedia: su crédito deja de aplicar.
          onChange({ ...value, backgroundImageUrl, backgroundImageCredit: backgroundImageUrl === value.backgroundImageUrl ? value.backgroundImageCredit : undefined })
        }
        authHeaders={authHeaders}
      />
      {value.backgroundImageCredit && (
        <p className="text-xs text-foreground/55">
          Crédito de la foto (lo exige su licencia): {value.backgroundImageCredit.text}. Se quita solo al cambiar la imagen.
        </p>
      )}
    </div>
  );
}

const PLATFORMS = ["instagram", "facebook", "tiktok", "linkedin", "x", "youtube", "other"];

function ContactForm({ value, onChange }: { value: Content["contact"]; onChange: (v: Content["contact"]) => void }) {
  const hours = value.hours ?? [];
  const socials = value.socials ?? [];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Teléfono" value={value.phone ?? ""} onChange={(phone) => onChange({ ...value, phone })} />
        <Field label="WhatsApp (solo números, con 56)" value={value.whatsapp ?? ""} onChange={(w) => onChange({ ...value, whatsapp: w.replace(/\D/g, "") })} />
        <Field label="Correo (recibe el formulario de contacto)" value={value.email ?? ""} onChange={(email) => onChange({ ...value, email })} />
        <Field label="Ubicación" value={value.address ?? ""} onChange={(address) => onChange({ ...value, address })} />
      </div>
      <Field label="Mensaje inicial de WhatsApp" value={value.whatsappPrefilledMessage ?? ""} onChange={(m) => onChange({ ...value, whatsappPrefilledMessage: m })} />
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground/60">Horario</p>
        {hours.map((h, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2">
            <input className={input} value={h.day} onChange={(e) => onChange({ ...value, hours: hours.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)) })} />
            <input className={`${input} w-24`} type="time" disabled={h.closed} value={h.open ?? ""} onChange={(e) => onChange({ ...value, hours: hours.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)) })} />
            <input className={`${input} w-24`} type="time" disabled={h.closed} value={h.close ?? ""} onChange={(e) => onChange({ ...value, hours: hours.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)) })} />
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={Boolean(h.closed)} onChange={(e) => onChange({ ...value, hours: hours.map((x, j) => (j === i ? { ...x, closed: e.target.checked } : x)) })} />
              Cerrado
            </label>
            <button className={btnGhost} aria-label="Quitar" onClick={() => onChange({ ...value, hours: hours.filter((_, j) => j !== i) })}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button className={btnGhost} onClick={() => onChange({ ...value, hours: [...hours, { day: "", open: "09:00", close: "18:00" }] })}>
          <Plus size={13} /> Agregar horario
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground/60">Redes sociales</p>
        {socials.map((s, i) => (
          <div key={i} className="flex gap-2">
            <select className={`${input} w-36`} value={s.platform} onChange={(e) => onChange({ ...value, socials: socials.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)) })}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input className={input} value={s.url} placeholder="https://…" onChange={(e) => onChange({ ...value, socials: socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
            <button className={btnGhost} aria-label="Quitar" onClick={() => onChange({ ...value, socials: socials.filter((_, j) => j !== i) })}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button className={btnGhost} onClick={() => onChange({ ...value, socials: [...socials, { platform: "instagram", url: "" }] })}>
          <Plus size={13} /> Agregar red
        </button>
      </div>
    </div>
  );
}

// ---------- Títulos y menú ----------

// Etiquetas legibles de cada grupo y campo (las claves son las del esquema).
const TITLE_GROUPS: { key: string; label: string; fields: [string, string, boolean?][] }[] = [
  { key: "properties", label: "Propiedades destacadas", fields: [["eyebrow", "Antetítulo"], ["title", "Título"], ["subtitle", "Bajada", true], ["cta", "Botón"]] },
  { key: "exclusive", label: "En Exclusiva", fields: [["eyebrow", "Antetítulo"], ["title", "Título"], ["subtitle", "Bajada"], ["cta", "Botón"]] },
  { key: "services", label: "Servicios", fields: [["eyebrow", "Antetítulo"], ["title", "Título"]] },
  { key: "about", label: "Nosotros (el título se edita en la sección Nosotros)", fields: [["eyebrow", "Antetítulo"]] },
  { key: "team", label: "Asesores", fields: [["eyebrow", "Antetítulo"], ["title", "Título"], ["subtitle", "Bajada", true]] },
  { key: "testimonials", label: "Testimonios", fields: [["eyebrow", "Antetítulo"], ["title", "Título"]] },
  { key: "instagram", label: "Instagram", fields: [["eyebrow", "Antetítulo"], ["title", "Título"], ["subtitle", "Bajada"]] },
  { key: "pricing", label: "Valores", fields: [["eyebrow", "Antetítulo"], ["title", "Título"], ["subtitle", "Bajada"]] },
  { key: "faq", label: "Preguntas frecuentes", fields: [["eyebrow", "Antetítulo"], ["title", "Título"], ["cta", "Botón de WhatsApp"]] },
  {
    key: "contact",
    label: "Contacto",
    fields: [["eyebrow", "Antetítulo"], ["title", "Título"], ["subtitle", "Bajada", true], ["formTitle", "Título del formulario"], ["formSubtitle", "Bajada del formulario"]],
  },
];

const NAV_FIELDS: [string, string][] = [
  ["properties", "Propiedades"],
  ["services", "Servicios"],
  ["team", "Equipo"],
  ["pricing", "Valores"],
  ["contact", "Contacto"],
  ["cta", "Botón destacado (WhatsApp)"],
];

function TitlesForm({ value, onChange }: { value: Content["titles"]; onChange: (v: Content["titles"]) => void }) {
  const setSection = (group: string, field: string, v: string) =>
    onChange({ ...value, sections: { ...value.sections, [group]: { ...(value.sections[group] ?? {}), [field]: v } } });
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold">Menú</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {NAV_FIELDS.map(([key, label]) => (
            <Field key={key} label={label} value={value.nav[key] ?? ""} onChange={(v) => onChange({ ...value, nav: { ...value.nav, [key]: v } })} />
          ))}
        </div>
      </div>
      {TITLE_GROUPS.map((g) => (
        <details key={g.key} className="rounded-lg border border-foreground/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold">{g.label}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {g.fields.map(([field, label, multiline]) => (
              <div key={field} className={multiline ? "sm:col-span-2" : ""}>
                <Field label={label} value={value.sections[g.key]?.[field] ?? ""} onChange={(v) => setSection(g.key, field, v)} multiline={multiline} />
              </div>
            ))}
          </div>
        </details>
      ))}
      <p className="text-xs text-foreground/55">Si dejas un campo vacío, se usa el texto original.</p>
    </div>
  );
}
