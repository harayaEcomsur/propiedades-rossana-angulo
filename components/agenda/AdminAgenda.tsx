"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Booking } from "@/lib/booking-store";
import { buildBookingClientWaLink } from "@/lib/whatsapp";
import { buildGoogleCalendarUrl } from "@/lib/calendar";

const STATUS_STYLE: Record<Booking["status"], string> = {
  pendiente: "bg-amber-500/15 text-amber-600 border-amber-500/40",
  pendiente_autorizacion: "bg-red-500/15 text-red-600 border-red-500/40",
  confirmada: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40",
  cancelada: "bg-foreground/10 text-foreground/50 border-foreground/20",
};

const STATUS_LABEL: Record<Booking["status"], string> = {
  pendiente: "pendiente",
  pendiente_autorizacion: "requiere autorización",
  confirmada: "confirmada",
  cancelada: "cancelada",
};

// Panel del dueño: revisar reservas, confirmarlas (tras recibir el abono),
// cancelarlas y bloquear días u horas en que no puede recibir agenda.
export function AdminAgenda({
  adminKey,
  notifyEmail,
  businessName,
  services,
}: {
  // Ausente cuando el dueño entró con Google (la sesión va por cookie, no por
  // clave). Presente solo si el sitio sigue usando ?clave= — ver lib/auth.ts.
  adminKey?: string;
  notifyEmail: string | null;
  businessName: string;
  services: { title: string; durationMinutes?: number; price?: string }[];
}) {
  const [role, setRole] = useState<"admin" | "staff" | null>(null);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [myProfessionalId, setMyProfessionalId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statsRange, setStatsRange] = useState<"hoy" | "semana" | "mes">("semana");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [blockDate, setBlockDate] = useState("");
  const [blockTime, setBlockTime] = useState("");
  const [blockProfessional, setBlockProfessional] = useState("");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [waMode, setWaMode] = useState<"wame" | "api">("wame");
  const [testResult, setTestResult] = useState<string>("");
  const [calCopied, setCalCopied] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [maxDailyMinutes, setMaxDailyMinutesState] = useState<string>("");
  const [minLeadMinutes, setMinLeadMinutesState] = useState(0);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [professionalsForm, setProfessionalsForm] = useState<
    { id: string; name: string; email: string; services: string[] }[]
  >([]);
  const [savingProfessionals, setSavingProfessionals] = useState(false);
  const [professionalsSaved, setProfessionalsSaved] = useState(false);
  const [hoursForm, setHoursForm] = useState<{ open: string; close: string; closed: boolean }[]>([]);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  // Absoluta recién en el cliente para no diferir del HTML del servidor (hidratación).
  const [calendarUrl, setCalendarUrl] = useState(`/api/agenda/calendario?clave=${adminKey ?? ""}`);
  useEffect(() => {
    setCalendarUrl(`${window.location.origin}/api/agenda/calendario?clave=${adminKey ?? ""}`);
  }, [adminKey]);

  const refresh = useCallback(async () => {
    const d = await fetch("/api/agenda", { headers: adminKey ? { "x-agenda-key": adminKey } : {} }).then((r) =>
      r.json()
    );
    setRole(d.role === "staff" ? "staff" : "admin");
    setProfessionals(d.professionals ?? []);
    setMyProfessionalId(d.myProfessionalId ?? null);
    setBookings(d.bookings ?? []);
    setBlocked(d.blocked ?? []);
    if (d.notify) {
      setEmail(d.notify.email ?? "");
      setWhatsapp(d.notify.whatsapp ?? "");
      setWaMode(d.notify.whatsappMode === "api" ? "api" : "wame");
    }
    setDurations({ ...Object.fromEntries(services.map((s) => [s.title, s.durationMinutes ?? 60])), ...(d.serviceDurations ?? {}) });
    setPrices({ ...Object.fromEntries(services.map((s) => [s.title, s.price ?? ""])), ...(d.servicePrices ?? {}) });
    setMaxDailyMinutesState(d.maxDailyMinutes ? String(d.maxDailyMinutes) : "");
    if (typeof d.minLeadMinutes === "number") setMinLeadMinutesState(d.minLeadMinutes);
    if (d.professionalsFull) {
      setProfessionalsForm(
        d.professionalsFull.map((p: { id: string; name: string; email?: string; services?: string[] }) => ({
          id: p.id,
          name: p.name,
          email: p.email ?? "",
          services: p.services ?? [],
        }))
      );
    }
    if (d.hours) {
      setHoursForm(
        d.hours.map((h: { open?: string; close?: string; closed?: boolean }) => ({
          open: h.open ?? "09:00",
          close: h.close ?? "18:00",
          closed: h.closed ?? false,
        }))
      );
    }
    setLoading(false);
  }, [adminKey, services]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function patch(body: object) {
    await fetch("/api/agenda", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(adminKey ? { "x-agenda-key": adminKey } : {}) },
      body: JSON.stringify(body),
    });
    refresh();
  }

  async function saveServiceConfig() {
    setSavingConfig(true);
    setConfigSaved(false);
    await patch({
      action: "serviceConfig",
      durations,
      prices,
      maxDailyMinutes: maxDailyMinutes.trim() ? Number(maxDailyMinutes) : null,
      minLeadMinutes,
    });
    setSavingConfig(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  }

  // Slug simple para el id — estable mientras no se borre la fila, aunque se
  // le cambie el nombre después (así no se "pierden" sus reservas pasadas).
  function slugify(name: string, taken: Set<string>): string {
    const base =
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita tildes tras NFD, igual que normalizeDay en booking-store.ts
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "profesional";
    let slug = base;
    let i = 2;
    while (taken.has(slug)) slug = `${base}-${i++}`;
    return slug;
  }

  function addProfessional() {
    setProfessionalsForm((prev) => [...prev, { id: "", name: "", email: "", services: [] }]);
  }
  function removeProfessional(index: number) {
    setProfessionalsForm((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveProfessionals() {
    setSavingProfessionals(true);
    setProfessionalsSaved(false);
    const taken = new Set(professionalsForm.filter((p) => p.id).map((p) => p.id));
    const withIds = professionalsForm
      .filter((p) => p.name.trim())
      .map((p) => (p.id ? p : { ...p, id: slugify(p.name, taken) }));
    withIds.forEach((p) => taken.add(p.id));
    setProfessionalsForm(withIds);
    await patch({
      action: "setProfessionals",
      professionals: withIds.map((p) => ({ id: p.id, name: p.name.trim(), email: p.email.trim(), services: p.services })),
    });
    setSavingProfessionals(false);
    setProfessionalsSaved(true);
    setTimeout(() => setProfessionalsSaved(false), 2500);
  }

  const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  async function saveHours() {
    setSavingHours(true);
    setHoursSaved(false);
    await patch({
      action: "setHours",
      hours: hoursForm.map((h) => (h.closed ? { closed: true } : { open: h.open, close: h.close })),
    });
    setSavingHours(false);
    setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 2500);
  }

  const isAdmin = role === "admin";
  const professionalName = (id: string) => professionals.find((p) => p.id === id)?.name;
  const pending = bookings.filter((b) => b.status === "pendiente").length;
  const needsAuth = bookings.filter((b) => b.status === "pendiente_autorizacion").length;
  const demoBooking = bookings.find((b) => b.status === "pendiente" && b.phone.replace(/\D/g, "").length >= 8);
  const waDigits = whatsapp.replace(/\D/g, "");

  // Estadísticas: todo calculado en el navegador desde lo que ya llegó con
  // /api/agenda (reservas, precios, horario, profesionales) — sin endpoint
  // nuevo. Rango siempre termina HOY (no proyecta reservas futuras del rango
  // como "logradas" todavía). El staff ve solo lo suyo porque `bookings` ya
  // viene filtrado desde el servidor para ese rol.
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(`${todayStr}T12:00:00`);
    let start = today;
    if (statsRange === "semana") {
      const dow = today.getDay(); // 0=domingo
      const diffToMonday = dow === 0 ? 6 : dow - 1;
      start = new Date(today);
      start.setDate(start.getDate() - diffToMonday);
    } else if (statsRange === "mes") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    const startStr = start.toISOString().slice(0, 10);

    const priceOf = (service: string) => Number((prices[service] ?? "").replace(/\D/g, "")) || 0;
    const inRange = bookings.filter((b) => b.date >= startStr && b.date <= todayStr);
    const activas = inRange.filter((b) => b.status !== "cancelada");
    const canceladas = inRange.filter((b) => b.status === "cancelada");
    const ingresos = activas.reduce((sum, b) => sum + priceOf(b.service), 0);
    const tasaCancelacion = inRange.length > 0 ? Math.round((canceladas.length / inRange.length) * 100) : 0;

    // Ocupación = minutos reservados / minutos de atención disponibles en el
    // rango (horario configurado × profesionales activos, día por día).
    let minutosDisponibles = 0;
    for (const cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
      const h = hoursForm[cursor.getDay()];
      if (h && !h.closed && h.open && h.close) {
        const [oh, om] = h.open.split(":").map(Number);
        const [ch, cm] = h.close.split(":").map(Number);
        minutosDisponibles += Math.max(0, ch * 60 + cm - (oh * 60 + om)) * Math.max(1, professionals.length);
      }
    }
    const minutosReservados = activas.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    const ocupacion = minutosDisponibles > 0 ? Math.min(100, Math.round((minutosReservados / minutosDisponibles) * 100)) : 0;

    const porProfesional = new Map<string, { reservas: number; ingresos: number }>();
    for (const b of activas) {
      const cur = porProfesional.get(b.professionalId) ?? { reservas: 0, ingresos: 0 };
      cur.reservas += 1;
      cur.ingresos += priceOf(b.service);
      porProfesional.set(b.professionalId, cur);
    }
    const ranking = [...porProfesional.entries()]
      .map(([id, v]) => ({ id, name: professionalName(id) ?? "Sin asignar", ...v }))
      .sort((a, b) => b.reservas - a.reservas);

    const porServicio = new Map<string, number>();
    for (const b of activas) porServicio.set(b.service, (porServicio.get(b.service) ?? 0) + 1);
    const serviciosTop = [...porServicio.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Recurrencia: se mide contra TODO el historial (no solo el rango) — una
    // reserva del rango cuenta como "de cliente recurrente" si ese teléfono
    // ya había reservado antes también.
    const historialPorTelefono = new Map<string, number>();
    for (const b of bookings) {
      if (b.status === "cancelada") continue;
      const key = b.phone.replace(/\D/g, "");
      historialPorTelefono.set(key, (historialPorTelefono.get(key) ?? 0) + 1);
    }
    const recurrentes = activas.filter((b) => (historialPorTelefono.get(b.phone.replace(/\D/g, "")) ?? 0) > 1).length;
    const pctRecurrentes = activas.length > 0 ? Math.round((recurrentes / activas.length) * 100) : 0;

    return { totalReservas: activas.length, ingresos, tasaCancelacion, ocupacion, ranking, serviciosTop, pctRecurrentes };
  }, [bookings, prices, hoursForm, professionals, statsRange]);

  return (
    <div className="flex flex-col gap-10">
      {role && (
        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            isAdmin
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-sky-500/40 bg-sky-500/10 text-sky-600"
          }`}
        >
          {isAdmin ? "Acceso: administrador" : "Acceso: staff"}
        </span>
      )}

      {/* Estadísticas — primero lo que todos ven al entrar. El staff ve las
          mismas tarjetas pero sobre SUS reservas (ya vienen filtradas del
          servidor); el ranking por profesional es solo para admin, comparar
          a los demás no le corresponde al staff. */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold text-foreground">Estadísticas</h2>
          <div className="flex gap-1.5 rounded-full border border-foreground/15 p-1">
            {(["hoy", "semana", "mes"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setStatsRange(r)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  statsRange === r ? "bg-primary text-white" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Reservas", value: String(stats.totalReservas) },
            { label: "Ingresos", value: `$${stats.ingresos.toLocaleString("es-CL")}` },
            { label: "Ocupación", value: `${stats.ocupacion}%` },
            { label: "Cancelación", value: `${stats.tasaCancelacion}%` },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-foreground/15 bg-foreground/[0.03] p-4">
              <p className="m-0 text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="m-0 mt-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">{kpi.label}</p>
            </div>
          ))}
        </div>

        {isAdmin && professionals.length > 1 && stats.ranking.length > 0 && (
          <div className="rounded-xl border border-foreground/15 p-4">
            <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Por profesional</p>
            <div className="flex flex-col gap-2">
              {stats.ranking.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-foreground">{p.name}</span>
                  <span className="text-foreground/60">
                    {p.reservas} reserva{p.reservas === 1 ? "" : "s"} · ${p.ingresos.toLocaleString("es-CL")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.serviciosTop.length > 0 && (
          <div className="rounded-xl border border-foreground/15 p-4">
            <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Servicios más pedidos</p>
            <div className="flex flex-col gap-2">
              {stats.serviciosTop.map(([service, count]) => (
                <div key={service} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-foreground">{service}</span>
                  <span className="text-foreground/60">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.totalReservas > 0 && (
          <p className="m-0 text-sm text-foreground/60">
            <strong className="text-foreground">{stats.pctRecurrentes}%</strong> de estas reservas son de clientes que ya
            habían reservado antes.
          </p>
        )}
      </section>

      {/* Notificaciones — solo admin: define a dónde llegan los avisos de TODO
          el negocio, no algo que cada miembro del staff deba tocar. */}
      {isAdmin && (
        <div className="rounded-xl border border-foreground/15 bg-foreground/[0.03] p-5 text-sm text-foreground/70">
          <p className="font-semibold text-foreground">🔔 Avisos de reserva nueva (gratis con wa.me)</p>
          <p className="mt-2 leading-relaxed">
            Cuando alguien agenda, te llega un <strong>correo</strong> con un enlace wa.me que abre WhatsApp con el
            resumen listo. No usa API de Meta ni módulos de pago — solo necesitas tu número abajo.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Tu correo
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={notifyEmail ?? "tucorreo@gmail.com"}
                className="rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm normal-case tracking-normal text-foreground"
              />
            </label>
            <label className="flex min-w-[180px] flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Tu WhatsApp ({businessName})
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+56 9 …"
                className="rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm tracking-normal text-foreground"
              />
            </label>
            <button
              onClick={async () => {
                setTestResult("…");
                await patch({ action: "setNotify", email, whatsapp });
                setTestResult("✅ Configuración guardada");
              }}
              className="rounded-lg border border-foreground/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary"
            >
              Guardar
            </button>
            <button
              onClick={async () => {
                setTestResult("…");
                await patch({ action: "setNotify", email, whatsapp });
                const r = await fetch("/api/agenda", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", ...(adminKey ? { "x-agenda-key": adminKey } : {}) },
                  body: JSON.stringify({ action: "testNotify" }),
                }).then((x) => x.json());
                if (r.waMeUrl) window.open(r.waMeUrl, "_blank", "noopener,noreferrer");
                setTestResult(
                  r.emailSent && r.waMeUrl
                    ? "✅ Correo enviado y WhatsApp abierto con el aviso de prueba"
                    : r.emailSent
                      ? "✅ Correo de prueba enviado — revísalo (incluye enlace wa.me)"
                      : r.waMeUrl
                        ? "✅ WhatsApp abierto con el aviso de prueba"
                        : "Ingresa correo o WhatsApp válido para probar"
                );
              }}
              className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
            >
              Probar aviso
            </button>
          </div>
          {testResult && <p className="mt-2 text-sm font-semibold text-foreground">{testResult}</p>}
          <p className="mt-3 opacity-80">
            {waMode === "api"
              ? "Además, con el módulo de WhatsApp activo, el aviso puede llegar automático sin abrir enlaces."
              : "El aviso por WhatsApp es vía wa.me (un toque desde el correo o el botón de prueba). El push automático sin tocar nada requiere el módulo de pago con API de Meta."}
          </p>
        </div>
      )}

      {/* wa.me — contacto manual a clientas */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm text-foreground/70">
        <p className="font-semibold text-foreground">💬 Responder a cada clienta (wa.me)</p>
        <p className="mt-2 leading-relaxed">
          En cada reserva, el botón <strong>WhatsApp</strong> abre tu app con el mensaje listo para coordinar el abono
          o confirmar la hora — gratis, sin API.
        </p>
        {demoBooking ? (
          <a
            href={buildBookingClientWaLink(demoBooking, businessName)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-600 hover:bg-emerald-500/20"
          >
            Probar mensaje a clienta (demo)
          </a>
        ) : (
          <p className="mt-3 text-foreground/60">Cuando llegue la primera reserva, el botón aparecerá ahí mismo.</p>
        )}
        {waDigits.length > 0 && waDigits.length < 8 && (
          <p className="mt-3 text-xs text-amber-600">Ingresa un WhatsApp válido arriba (ej. +56 9 1234 5678).</p>
        )}
      </div>

      {/* Sincronización con calendario (Google / Outlook / Apple) — el feed ICS
          es una URL que suscribe la app de calendario del negocio, así que
          necesita su propia clave incluso si el dueño entra con Google. */}
      {adminKey && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5 text-sm text-foreground/70">
          <p className="font-semibold text-foreground">📅 Tus reservas, en tu calendario de siempre</p>
          <p className="mt-2 leading-relaxed">
            Suscríbete una sola vez y tus reservas aparecen y se actualizan solas en Google Calendar,
            Outlook o el calendario del iPhone. Además, cada correo de aviso trae un botón
            {" “"}Agregar a Google Calendar{"”"} para anotar esa hora al instante.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="max-w-full overflow-x-auto rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-xs text-foreground">
              {calendarUrl}
            </code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(calendarUrl);
                setCalCopied(true);
                setTimeout(() => setCalCopied(false), 2500);
              }}
              className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-sky-600 hover:bg-sky-500/20"
            >
              {calCopied ? "✓ Copiado" : "Copiar enlace"}
            </button>
          </div>
          <p className="mt-3 text-xs opacity-80">
            En Google Calendar: Otros calendarios → + → Desde URL → pega el enlace. Google lo refresca
            automáticamente cada algunas horas.
          </p>
        </div>
      )}

      {/* Duración y precio por servicio, y tope diario — solo admin */}
      {isAdmin && (
      <section>
        <h2 className="font-heading text-xl font-bold text-foreground">Servicios: duración, precio y tope diario</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Cuánto ocupa cada servicio en tu agenda y qué precio muestra (en la home y al reservar), cuántas horas
          como máximo quieres atender por día, y con cuánta anticipación mínima puede reservar un cliente (aunque
          quede hora libre, no podrá tomar una que caiga dentro de ese margen desde ahora). Si una reserva hace que
          ese día supere el tope, no se confirma sola: queda esperando tu autorización abajo.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {services.map((s) => (
            <div
              key={s.title}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-foreground/15 px-4 py-2.5 text-sm"
            >
              <span className="font-semibold text-foreground">{s.title}</span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 text-foreground/60">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={durations[s.title] ?? s.durationMinutes ?? 60}
                    onChange={(e) =>
                      setDurations((prev) => ({ ...prev, [s.title]: Math.max(5, Number(e.target.value) || 0) }))
                    }
                    className="w-16 rounded-lg border border-foreground/20 bg-background px-2 py-1.5 text-right text-sm text-foreground"
                  />
                  min
                </label>
                <label className="flex items-center gap-1.5 text-foreground/60">
                  Precio
                  <input
                    type="text"
                    placeholder="ej. $12.000"
                    value={prices[s.title] ?? s.price ?? ""}
                    onChange={(e) => setPrices((prev) => ({ ...prev, [s.title]: e.target.value }))}
                    className="w-28 rounded-lg border border-foreground/20 bg-background px-2 py-1.5 text-sm text-foreground"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Tope de horas reservables por día (vacío = sin tope)
            <input
              type="number"
              min={1}
              placeholder="ej. 480 (8 horas)"
              value={maxDailyMinutes}
              onChange={(e) => setMaxDailyMinutesState(e.target.value)}
              className="w-56 rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm normal-case tracking-normal text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Anticipación mínima para reservar, en minutos (0 = ninguna)
            <input
              type="number"
              min={0}
              max={1440}
              step={5}
              value={minLeadMinutes}
              onChange={(e) => setMinLeadMinutesState(Number(e.target.value))}
              className="w-56 rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm normal-case tracking-normal text-foreground"
            />
          </label>
          <button
            onClick={saveServiceConfig}
            disabled={savingConfig}
            className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-60"
          >
            {savingConfig ? "Guardando…" : "Guardar"}
          </button>
          {configSaved && <p className="text-sm font-semibold text-foreground">✅ Guardado</p>}
        </div>
      </section>
      )}

      {/* Profesionales — quiénes atienden. Vacío = agenda compartida de
          siempre (un solo calendario). Nada precargado: se arma acá, no en
          el config del sitio. */}
      {isAdmin && (
      <section>
        <h2 className="font-heading text-xl font-bold text-foreground">Profesionales</h2>
        <p className="mt-1 text-sm text-foreground/60">
          ¿Más de una persona atendiendo (barberos, peluqueras, manicuristas)? Agrégalas acá — cada una puede
          tener su propia disponibilidad y, si le pones correo, su propio acceso a este panel (agrégala también en
          Google, contacta a HarayaDev). Sin nadie agregado, sigue siendo una sola agenda para todo el negocio.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {professionalsForm.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-foreground/15 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={p.name}
                  onChange={(e) =>
                    setProfessionalsForm((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                  }
                  placeholder="Nombre"
                  className="min-w-[160px] flex-1 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground"
                />
                <input
                  value={p.email}
                  onChange={(e) =>
                    setProfessionalsForm((prev) => prev.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))
                  }
                  placeholder="Correo (opcional, para que entre solo a lo suyo)"
                  className="min-w-[200px] flex-1 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
                />
                <button
                  type="button"
                  onClick={() => removeProfessional(i)}
                  className="rounded-lg border border-foreground/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground/60 hover:border-primary hover:text-primary"
                >
                  Quitar
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                <span className="uppercase tracking-wider">Atiende:</span>
                {services.length === 0 ? (
                  <span>(sin servicios configurados todavía)</span>
                ) : (
                  services.map((s) => (
                    <label key={s.title} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={p.services.includes(s.title)}
                        onChange={(e) =>
                          setProfessionalsForm((prev) =>
                            prev.map((x, j) =>
                              j !== i
                                ? x
                                : {
                                    ...x,
                                    services: e.target.checked
                                      ? [...x.services, s.title]
                                      : x.services.filter((t) => t !== s.title),
                                  }
                            )
                          )
                        }
                      />
                      {s.title}
                    </label>
                  ))
                )}
                <span className="opacity-70">(ninguno marcado = atiende todos)</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addProfessional}
            className="rounded-lg border border-foreground/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary"
          >
            + Agregar profesional
          </button>
          <button
            type="button"
            onClick={saveProfessionals}
            disabled={savingProfessionals}
            className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-60"
          >
            {savingProfessionals ? "Guardando…" : "Guardar"}
          </button>
          {professionalsSaved && <p className="text-sm font-semibold text-foreground">✅ Guardado</p>}
        </div>
      </section>
      )}

      {/* Horario de atención — de dónde sale la grilla de horas de la agenda.
          Nada fijo en el sitio: se define acá, día por día. */}
      {isAdmin && (
      <section>
        <h2 className="font-heading text-xl font-bold text-foreground">Horario de atención</h2>
        <p className="mt-1 text-sm text-foreground/60">
          De acá sale la grilla de horas que ven tus clientes al reservar — cámbialo cuando quieras, sin
          redesplegar el sitio.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {hoursForm.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-foreground/15 px-4 py-2.5 text-sm">
              <span className="w-24 font-semibold text-foreground">{WEEKDAY_LABELS[i]}</span>
              <label className="flex items-center gap-1.5 text-foreground/60">
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={(e) =>
                    setHoursForm((prev) => prev.map((x, j) => (j === i ? { ...x, closed: e.target.checked } : x)))
                  }
                />
                Cerrado
              </label>
              {!h.closed && (
                <>
                  <input
                    type="time"
                    value={h.open}
                    onChange={(e) =>
                      setHoursForm((prev) => prev.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))
                    }
                    className="rounded-lg border border-foreground/20 bg-background px-3 py-1.5 text-sm text-foreground"
                  />
                  <span className="text-foreground/50">a</span>
                  <input
                    type="time"
                    value={h.close}
                    onChange={(e) =>
                      setHoursForm((prev) => prev.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))
                    }
                    className="rounded-lg border border-foreground/20 bg-background px-3 py-1.5 text-sm text-foreground"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveHours}
            disabled={savingHours}
            className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-60"
          >
            {savingHours ? "Guardando…" : "Guardar"}
          </button>
          {hoursSaved && <p className="text-sm font-semibold text-foreground">✅ Guardado</p>}
        </div>
      </section>
      )}

      {/* Reservas */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-xl font-bold text-foreground">Reservas</h2>
          <div className="flex flex-wrap gap-2">
            {needsAuth > 0 && (
              <span className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-xs font-bold text-red-600">
                {needsAuth} requiere{needsAuth > 1 ? "n" : ""} autorización
              </span>
            )}
            {pending > 0 && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600">
                {pending} pendiente{pending > 1 ? "s" : ""} de abono
              </span>
            )}
          </div>
        </div>
        {!isAdmin && (
          <p className="mt-2 text-xs text-foreground/50">
            Cada cambio que hagas acá (confirmar, cancelar, bloquear) le llega avisado al administrador.
          </p>
        )}
        {loading ? (
          <p className="mt-4 text-sm text-foreground/60">Cargando…</p>
        ) : bookings.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">Aún no hay reservas.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-foreground/15 p-4">
                <div className="min-w-[220px] flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {b.service} <span className="font-normal text-foreground/50">· {b.id}</span>
                  </p>
                  <p className="text-sm text-foreground/70">
                    {new Date(b.date + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" })} · {b.time} hrs — {b.name} ({b.phone})
                    {isAdmin && professionalName(b.professionalId) && ` · ${professionalName(b.professionalId)}`}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${STATUS_STYLE[b.status]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
                {b.status === "pendiente_autorizacion" && (
                  <button
                    onClick={() => patch({ action: "status", id: b.id, status: "pendiente" })}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
                  >
                    ⚠️ Autorizar reserva
                  </button>
                )}
                {b.status === "pendiente" && (
                  <button
                    onClick={() => patch({ action: "status", id: b.id, status: "confirmada" })}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
                  >
                    ✓ Abono recibido — confirmar
                  </button>
                )}
                {b.status !== "cancelada" && b.phone.replace(/\D/g, "").length >= 8 && (
                  <a
                    href={buildBookingClientWaLink(b, businessName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-600 hover:bg-emerald-500/20"
                  >
                    💬 WhatsApp
                  </a>
                )}
                {b.status !== "cancelada" && (
                  <a
                    href={buildGoogleCalendarUrl(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-600 hover:bg-sky-500/20"
                  >
                    📅 Calendario
                  </a>
                )}
                {b.status !== "cancelada" && (
                  <button
                    onClick={() => patch({ action: "status", id: b.id, status: "cancelada" })}
                    className="rounded-lg border border-foreground/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground/60 hover:border-primary hover:text-primary"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bloqueos */}
      <section>
        <h2 className="font-heading text-xl font-bold text-foreground">Bloquear agenda</h2>
        <p className="mt-1 text-sm text-foreground/60">
          ¿Un día libre, vacaciones o una hora que no puedes atender? Bloquéala y desaparece de la
          agenda pública al instante.
          {!isAdmin && myProfessionalId && " Solo bloqueas tu propia agenda — el resto del equipo no se ve afectado."}
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Día
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Hora (vacío = día completo)
            <input
              type="time"
              value={blockTime}
              onChange={(e) => setBlockTime(e.target.value)}
              step={1800}
              className="rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm text-foreground"
            />
          </label>
          {isAdmin && professionals.length > 0 && (
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Para quién
              <select
                value={blockProfessional}
                onChange={(e) => setBlockProfessional(e.target.value)}
                className="rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm normal-case tracking-normal text-foreground"
              >
                <option value="">Todo el negocio</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            disabled={!blockDate}
            onClick={() => {
              const base = blockTime ? `${blockDate} ${blockTime}` : blockDate;
              const key = isAdmin && blockProfessional ? `${base}|${blockProfessional}` : base;
              patch({ action: "toggleBlock", key });
            }}
            className="rounded-lg bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-background hover:opacity-90 disabled:opacity-40"
          >
            Bloquear / desbloquear
          </button>
        </div>
        {blocked.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {blocked.map((k) => {
              const [base, profId] = k.split("|");
              const label = profId ? `${base} (${professionalName(profId) ?? profId})` : base;
              return (
                <button
                  key={k}
                  onClick={() => patch({ action: "toggleBlock", key: k })}
                  title="Click para desbloquear"
                  className="rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:border-primary hover:text-primary"
                >
                  🚫 {label} ✕
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
