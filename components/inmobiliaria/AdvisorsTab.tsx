"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Mail, MessageCircle, Pencil, Phone } from "lucide-react";
import { ImageField } from "@/components/inmobiliaria/SiteEditor";
import { TeamAvatar } from "@/components/layouts/inmobiliaria/TeamAvatar";

// Asesores = usuarios del panel + equipo público del sitio. La pestaña
// "Asesores" (administradores) da de alta con el correo de Google con que la
// persona entra, edita fichas, orden y visibilidad. "Mi ficha" (todos) muestra
// la tarjeta tal como se ve en el sitio y deja editar foto, presentación y
// contacto.

export interface AdvisorData {
  id: string;
  name: string;
  email: string;
  role: "admin" | "corredor";
  active: boolean;
  superadmin?: boolean;
  title?: string;
  photoUrl?: string;
  bio?: string;
  phone?: string;
  whatsapp?: string;
  showOnSite: boolean;
  sortOrder: number;
}

const card = "rounded-xl border border-foreground/15 p-4 sm:p-5";
const input = "w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground";
const btnPrimary = "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-1.5 rounded-lg border border-foreground/20 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-40";

async function api(method: "POST" | "PATCH", headers: Record<string, string>, body: unknown) {
  const res = await fetch("/api/inmobiliaria", { method, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error");
  return data;
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-foreground/60">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

// Tarjeta igual a la del sitio (sección "Nuestros asesores").
export function AdvisorPreview({ a, index }: { a: AdvisorData; index: number }) {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center bg-background px-6 pb-6 pt-8 text-center shadow-[0_8px_30px_-14px_rgba(0,0,0,0.25)]">
      <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-primary ring-offset-4 ring-offset-background">
        {a.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <TeamAvatar name={a.name} index={index} />
        )}
      </div>
      <p className="mt-5 font-heading text-lg font-semibold">{a.name}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">{a.title || "Asesor inmobiliario"}</p>
      {a.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/65">{a.bio}</p>}
      <div className="mt-4 flex gap-2 text-foreground/60">
        {a.whatsapp && <MessageCircle size={16} aria-label="WhatsApp" />}
        {a.phone && <Phone size={16} aria-label="Teléfono" />}
        {a.email && <Mail size={16} aria-label="Correo" />}
      </div>
    </div>
  );
}

// ---------- Mi ficha ----------

export function MyProfileTab({ me, index, authHeaders, reload }: { me: AdvisorData; index: number; authHeaders: Record<string, string>; reload: () => void }) {
  const [photoUrl, setPhotoUrl] = useState(me.photoUrl);
  const [bio, setBio] = useState(me.bio ?? "");
  const [phone, setPhone] = useState(me.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(me.whatsapp ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await api("PATCH", authHeaders, { kind: "broker-profile", id: me.id, photoUrl: photoUrl ?? "", bio, phone, whatsapp });
      setMsg({ ok: true, text: "Ficha actualizada y publicada en el sitio." });
      reload();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  const preview: AdvisorData = { ...me, photoUrl, bio, phone, whatsapp };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className={card}>
        <h3 className="font-semibold">Mi ficha</h3>
        <p className="mb-4 mt-1 text-xs text-foreground/55">
          Así apareces en la sección de asesores del sitio. Tu nombre y cargo los define la administración.
          {!me.showOnSite && " Hoy tu ficha está oculta en el sitio."}
        </p>
        <div className="space-y-4">
          <ImageField label="Foto (cuadrada, de hombros hacia arriba)" value={photoUrl} onChange={setPhotoUrl} authHeaders={authHeaders} round />
          <Labeled label="Presentación (1-2 líneas)">
            <textarea className={input} rows={3} maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} />
          </Labeled>
          <div className="grid gap-3 sm:grid-cols-2">
            <Labeled label="Teléfono">
              <input className={input} value={phone} placeholder="+56 9 1234 5678" onChange={(e) => setPhone(e.target.value)} />
            </Labeled>
            <Labeled label="WhatsApp (solo números, con 56)">
              <input className={input} value={whatsapp} placeholder="56912345678" onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))} />
            </Labeled>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className={btnPrimary} disabled={busy} onClick={save}>
            {busy ? "Guardando…" : "Guardar mi ficha"}
          </button>
          <a href="/#equipo" target="_blank" rel="noopener noreferrer" className={btnGhost}>
            <Eye size={13} /> Ver en el sitio
          </a>
          {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/50">Vista previa</p>
        <AdvisorPreview a={preview} index={index} />
      </div>
    </div>
  );
}

// ---------- Asesores (administradores) ----------

export function AdvisorsTab({
  advisors,
  currentId,
  authHeaders,
  reload,
}: {
  advisors: AdvisorData[];
  currentId: string;
  authHeaders: Record<string, string>;
  reload: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function move(i: number, d: -1 | 1) {
    const ids = advisors.map((a) => a.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    try {
      await api("PATCH", authHeaders, { kind: "broker-order", ids });
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function patch(body: unknown) {
    setErr(null);
    try {
      await api("PATCH", authHeaders, body);
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AddAdvisor authHeaders={authHeaders} reload={reload} />

      <div className={card}>
        <h3 className="font-semibold">Asesores</h3>
        <p className="mb-4 mt-1 text-xs text-foreground/55">
          Cada asesor entra al panel con su correo de Google y aparece en la sección de asesores del sitio en este orden. El ojo
          controla si se muestra en el sitio; desactivar le quita el acceso al panel y lo saca del sitio.
        </p>
        {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
        <ul className="flex flex-col gap-2">
          {advisors.map((a, i) => (
            <li key={a.id} className={`rounded-lg border border-foreground/10 p-3 ${a.active ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  {a.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <TeamAvatar name={a.name} index={i} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {a.name}{" "}
                    <span className="text-xs text-foreground/50">
                      · {a.role === "admin" ? "administrador/a" : "asesor/a"}
                      {!a.active && " · desactivado"}
                      {a.active && !a.showOnSite && " · oculto en el sitio"}
                    </span>
                  </p>
                  <p className="truncate text-xs text-foreground/50">
                    {a.title || "Sin cargo"} · {a.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button className={btnGhost} aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp size={13} />
                  </button>
                  <button className={btnGhost} aria-label="Bajar" disabled={i === advisors.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown size={13} />
                  </button>
                  <button
                    className={btnGhost}
                    aria-label={a.showOnSite ? "Ocultar en el sitio" : "Mostrar en el sitio"}
                    title={a.showOnSite ? "Visible en el sitio" : "Oculto en el sitio"}
                    onClick={() => patch({ kind: "broker-profile", id: a.id, showOnSite: !a.showOnSite })}
                  >
                    {a.showOnSite ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button className={btnGhost} onClick={() => setEditing(editing === a.id ? null : a.id)}>
                    <Pencil size={13} /> Editar
                  </button>
                  {a.id !== currentId && (
                    <button className={btnGhost} onClick={() => patch({ kind: "broker-active", id: a.id, active: !a.active })}>
                      {a.active ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </div>
              </div>
              {editing === a.id && (
                <EditAdvisor
                  a={a}
                  index={i}
                  isSelf={a.id === currentId}
                  authHeaders={authHeaders}
                  onDone={() => {
                    setEditing(null);
                    reload();
                  }}
                />
              )}
            </li>
          ))}
          {advisors.length === 0 && <p className="text-sm text-foreground/50">Todavía no hay asesores.</p>}
        </ul>
      </div>
    </div>
  );
}

function AddAdvisor({ authHeaders, reload }: { authHeaders: Record<string, string>; reload: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Asesora inmobiliaria");
  const [role, setRole] = useState<"admin" | "corredor">("corredor");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function add() {
    setBusy(true);
    setMsg(null);
    try {
      await api("POST", authHeaders, { kind: "broker", name, email, title, role, phone, whatsapp });
      setMsg({ ok: true, text: `${name} ya puede entrar al panel con ${email} y aparece en el sitio.` });
      setName("");
      setEmail("");
      setPhone("");
      setWhatsapp("");
      reload();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={card}>
      <h3 className="font-semibold">Agregar asesor</h3>
      <p className="mb-3 mt-1 text-xs text-foreground/55">
        <strong>Asesor/a</strong>: carga y gestiona sus propiedades, clientes, entregas y contratos, y edita su ficha.{" "}
        <strong>Administrador/a</strong>: además ve todo, gestiona asesores y edita el sitio. Usa el correo de Google con que la
        persona va a entrar (por ejemplo, su correo del dominio).
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Labeled label="Nombre">
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
        </Labeled>
        <Labeled label="Correo de Google">
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Labeled>
        <Labeled label="Cargo (visible en el sitio)">
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Labeled>
        <Labeled label="Rol en el panel">
          <select className={input} value={role} onChange={(e) => setRole(e.target.value as "admin" | "corredor")}>
            <option value="corredor">Asesor/a</option>
            <option value="admin">Administrador/a</option>
          </select>
        </Labeled>
        <Labeled label="Teléfono (opcional)">
          <input className={input} value={phone} placeholder="+56 9 1234 5678" onChange={(e) => setPhone(e.target.value)} />
        </Labeled>
        <Labeled label="WhatsApp (opcional, solo números con 56)">
          <input className={input} value={whatsapp} placeholder="56912345678" onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))} />
        </Labeled>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className={btnPrimary} disabled={busy || !name || !email} onClick={add}>
          {busy ? "Agregando…" : "Agregar asesor"}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}

function EditAdvisor({
  a,
  index,
  isSelf,
  authHeaders,
  onDone,
}: {
  a: AdvisorData;
  index: number;
  isSelf: boolean;
  authHeaders: Record<string, string>;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    name: a.name,
    title: a.title ?? "",
    role: a.role,
    photoUrl: a.photoUrl,
    bio: a.bio ?? "",
    phone: a.phone ?? "",
    whatsapp: a.whatsapp ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await api("PATCH", authHeaders, { kind: "broker-profile", id: a.id, ...f, photoUrl: f.photoUrl ?? "", role: isSelf ? undefined : f.role });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 grid gap-5 border-t border-foreground/10 pt-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        <ImageField label="Foto" value={f.photoUrl} onChange={(photoUrl) => setF({ ...f, photoUrl })} authHeaders={authHeaders} round />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled label="Nombre">
            <input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Labeled>
          <Labeled label="Cargo">
            <input className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </Labeled>
          <Labeled label="Teléfono">
            <input className={input} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </Labeled>
          <Labeled label="WhatsApp (solo números con 56)">
            <input className={input} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value.replace(/\D/g, "") })} />
          </Labeled>
          {!isSelf && (
            <Labeled label="Rol en el panel">
              <select className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "admin" | "corredor" })}>
                <option value="corredor">Asesor/a</option>
                <option value="admin">Administrador/a</option>
              </select>
            </Labeled>
          )}
        </div>
        <Labeled label="Presentación (1-2 líneas)">
          <textarea className={input} rows={3} maxLength={400} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        </Labeled>
        <div className="flex flex-wrap items-center gap-3">
          <button className={btnPrimary} disabled={busy} onClick={save}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
          <button className={btnGhost} onClick={onDone}>
            Cancelar
          </button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      </div>
      <AdvisorPreview a={{ ...a, ...f }} index={index} />
    </div>
  );
}
