import { clientConfig } from "@/config/client.config";
import { db, ensureSchema, hasDb, jsonb, withDb } from "@/lib/db";

// Almacén de reservas del módulo agenda.
//
// Con DATABASE_URL (Neon) las reservas viven en Postgres y son las mismas para
// todos los isolates de Vercel; la base garantiza además que dos personas no
// tomen la misma hora. Sin DATABASE_URL funciona en memoria (globalThis) con
// datos sembrados: así una demo arranca sin configurar nada y el panel del
// dueño nunca se ve vacío. Ver lib/db.ts.

export interface Booking {
  id: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  name: string;
  phone: string;
  // "pendiente_autorizacion": la reserva superó el tope diario de horas y
  // necesita que el dueño la autorice antes de seguir el flujo normal (abono).
  status: "pendiente" | "pendiente_autorizacion" | "confirmada" | "cancelada";
  // Duración reservada en minutos, fija al momento de crear la reserva.
  durationMinutes: number;
  // Qué profesional atiende esta reserva. SHARED_PROFESSIONAL_ID para clientes
  // que no usan `clientConfig.professionals` — un solo calendario, como antes.
  professionalId: string;
  // Presente cuando el abono se pagó online con Webpay.
  payment?: { amount: number; authorizationCode?: string; cardLast4?: string };
  createdAt: string;
}

export interface Professional {
  id: string;
  name: string;
  photoUrl?: string;
  email?: string;
  services?: string[];
}

export interface DayHoursOverride {
  open?: string;
  close?: string;
  closed?: boolean;
}

// Calendario único de siempre, para clientes sin profesionales configurados
// — ver la nota en lib/db.ts sobre por qué es un string fijo y no NULL.
export const SHARED_PROFESSIONAL_ID = "_shared";

// `client.config.ts` es solo la SEMILLA inicial de profesionales y horario —
// nunca la fuente de verdad en vivo. El dueño los agrega/edita desde el panel
// (guardado en `settings`, igual que duración/precio/tope diario) sin tocar
// el config ni redesplegar. Ver getProfessionalsOverride/getHoursOverride.

// Config-only, SIN el override guardado — únicamente para sembrar datos de
// demo en memoria (seed()), donde por definición todavía no existe override.
function configProfessionals(service?: string): Professional[] {
  const configured = clientConfig.professionals ?? [];
  if (configured.length === 0) return [{ id: SHARED_PROFESSIONAL_ID, name: clientConfig.meta.businessName }];
  if (!service) return configured;
  return configured.filter((p) => !p.services?.length || p.services.includes(service));
}

export async function getProfessionalsOverride(): Promise<Professional[] | null> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = 'professionals' LIMIT 1`;
      return (rows[0]?.value as Professional[] | undefined) ?? null;
    },
    () => store().professionalsOverride ?? null
  );
}

export async function setProfessionalsOverride(list: Professional[]): Promise<void> {
  await withDb(
    async () => {
      const sql = db();
      await sql`
        INSERT INTO settings (key, value) VALUES ('professionals', ${jsonb(list)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    },
    () => {
      store().professionalsOverride = [...list];
    }
  );
}

export async function multiProfessionalEnabled(): Promise<boolean> {
  const override = await getProfessionalsOverride();
  return (override ?? clientConfig.professionals ?? []).length > 0;
}

// Profesionales elegibles para un servicio (o todos, sin filtrar por
// servicio). Sin ninguno configurado (ni override ni config), es un único
// profesional implícito que representa al negocio completo — así el resto
// del motor (buildSlots, createBooking) no necesita un camino especial para
// el caso "agenda compartida": simplemente hay un solo id posible.
export async function eligibleProfessionals(service?: string): Promise<Professional[]> {
  const override = await getProfessionalsOverride();
  const configured = override ?? clientConfig.professionals ?? [];
  if (configured.length === 0) return [{ id: SHARED_PROFESSIONAL_ID, name: clientConfig.meta.businessName }];
  if (!service) return configured;
  return configured.filter((p) => !p.services?.length || p.services.includes(service));
}

// Con qué profesional se calza la sesión de alguien que entra al panel — así
// el staff ve y gestiona SOLO sus propias reservas. Requiere que el correo de
// su login (admin.users) sea EXACTAMENTE el mismo que en professionals[].email.
export async function professionalIdForEmail(email: string): Promise<string | null> {
  const list = await eligibleProfessionals();
  return list.find((p) => p.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

// Nombre para mostrar en avisos/panel — null en agenda compartida (mostrar
// "con Mi Negocio" sería ruido, no información).
export async function professionalDisplayName(id: string): Promise<string | null> {
  if (id === SHARED_PROFESSIONAL_ID) return null;
  const list = await eligibleProfessionals();
  return list.find((p) => p.id === id)?.name ?? null;
}

interface Store {
  bookings: Booking[];
  // "YYYY-MM-DD" bloquea el día completo; "YYYY-MM-DD HH:mm" bloquea una hora.
  blocked: string[];
  // Destinos de aviso configurables desde el panel (para la demo en vivo y para
  // que el negocio los cambie sin tocar variables de entorno).
  notify: { email?: string; whatsapp?: string };
  notifyQuota?: { date: string; sent: number };
  // Duración, precio por servicio y tope diario configurables desde el panel,
  // sin tocar el config ni redesplegar. Ausente = usa lo que trae el config.
  serviceDurations: Record<string, number>;
  servicePrices: Record<string, string>;
  maxDailyMinutes?: number;
  // Minutos mínimos de anticipación exigidos para reservar (0 = sin mínimo),
  // configurable desde el panel del dueño.
  minLeadMinutes: number;
  // Profesionales y horario de atención configurables desde el panel, sin
  // tocar el config ni redesplegar. Ausente = usa lo que trae el config.
  professionalsOverride?: Professional[];
  hoursOverride?: DayHoursOverride[];
  seeded: boolean;
}

const g = globalThis as unknown as { __bookingStore?: Store };

function store(): Store {
  if (!g.__bookingStore) {
    g.__bookingStore = {
      bookings: [],
      blocked: [],
      notify: {},
      serviceDurations: {},
      servicePrices: {},
      minLeadMinutes: 0,
      seeded: false,
    };
    // Los datos de ejemplo son para las demos. Un cliente real con base de
    // datos jamás debe ver reservas inventadas en su panel.
    if (!hasDb()) seed(g.__bookingStore);
  }
  return g.__bookingStore;
}

// createBooking necesita distinguir el choque de horario de otros errores, así
// que no usa withDb (que degrada a memoria en silencio) sino este envoltorio.
async function ensureSchemaThen(operation: () => Promise<void>): Promise<void> {
  await ensureSchema();
  await operation();
}

// Fila de Postgres → Booking.
function rowToBooking(r: Record<string, unknown>): Booking {
  return {
    id: String(r.id),
    service: String(r.service),
    date: String(r.date),
    time: String(r.time),
    name: String(r.name),
    phone: String(r.phone),
    status: r.status as Booking["status"],
    durationMinutes: Number(r.duration_minutes ?? clientConfig.booking?.slotMinutes ?? 60),
    professionalId: String(r.professional_id ?? SHARED_PROFESSIONAL_ID),
    payment: (r.payment as Booking["payment"]) ?? undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

// Datos de ejemplo para que el panel del dueño nunca se vea vacío en la demo.
function seed(s: Store) {
  if (s.seeded) return;
  const d = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  const services = clientConfig.services.map((x) => x.title);
  const svc = (i: number) => services[i % Math.max(services.length, 1)] ?? "Servicio";
  const dur = (title: string) => configDurationFor(title);
  const firstProfessional = configProfessionals()[0]?.id ?? SHARED_PROFESSIONAL_ID;
  s.bookings.push(
    { id: "demo-1", service: svc(0), date: d(1), time: "11:00", name: "Camila R.", phone: "+56 9 5555 1111", status: "pendiente", durationMinutes: dur(svc(0)), professionalId: firstProfessional, createdAt: new Date().toISOString() },
    { id: "demo-2", service: svc(1), date: d(1), time: "15:00", name: "Fernanda M.", phone: "+56 9 5555 2222", status: "confirmada", durationMinutes: dur(svc(1)), professionalId: firstProfessional, createdAt: new Date().toISOString() },
    { id: "demo-3", service: svc(4), date: d(2), time: "10:00", name: "Valentina S.", phone: "+56 9 5555 3333", status: "confirmada", durationMinutes: dur(svc(4)), professionalId: firstProfessional, createdAt: new Date().toISOString() }
  );
  s.blocked.push(d(3)); // un día bloqueado de ejemplo
  if (clientConfig.booking?.ownerNotifyWhatsapp) {
    s.notify.whatsapp = clientConfig.booking.ownerNotifyWhatsapp;
  }
  if (clientConfig.booking?.ownerNotifyEmail) {
    s.notify.email = clientConfig.booking.ownerNotifyEmail;
  }
  s.seeded = true;
}

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Sin tildes ni mayúsculas, para comparar "miércoles"/"Miercoles"/"sábado" parejo.
function normalizeDay(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const DAY_NAMES_NORM = DAY_NAMES.map(normalizeDay);

// ¿El día `dayIdx` (0=domingo) calza con una etiqueta como "Lunes a viernes",
// "Martes a sábado", "Lunes y domingo" o "Jueves"? Los rangos "X a Y" se expanden
// de verdad (incluye los días intermedios) y soportan cruce de semana
// ("Viernes a lunes"); cualquier otra etiqueta calza si menciona el día.
function dayMatchesLabel(dayIdx: number, label: string): boolean {
  const l = normalizeDay(label);
  const range = l.match(/([a-z]+)\s+a\s+([a-z]+)/);
  if (range) {
    const from = DAY_NAMES_NORM.indexOf(range[1]);
    const to = DAY_NAMES_NORM.indexOf(range[2]);
    if (from >= 0 && to >= 0) {
      return from <= to ? dayIdx >= from && dayIdx <= to : dayIdx >= from || dayIdx <= to;
    }
  }
  return l.includes(DAY_NAMES_NORM[dayIdx]);
}

// Horario efectivo para una fecha. Con override guardado (7 posiciones,
// índice = getDay(), 0=domingo), manda ese. Sin override, cae al horario
// "de fábrica" del config (etiquetas flexibles tipo "Lunes a viernes") — el
// mismo comportamiento de siempre para clientes que nunca tocaron el panel.
function hoursForDate(date: string, override: DayHoursOverride[] | null): { open: string; close: string } | null {
  const dayIdx = new Date(date + "T12:00:00").getDay();
  if (override) {
    const h = override[dayIdx];
    if (!h || h.closed || !h.open || !h.close) return null;
    return { open: h.open, close: h.close };
  }
  for (const h of clientConfig.contact.hours ?? []) {
    if (dayMatchesLabel(dayIdx, h.day)) {
      if (h.closed || !h.open || !h.close) return null;
      return { open: h.open, close: h.close };
    }
  }
  return null;
}

// Lo que el config "de fábrica" dice para cada día de la semana (domingo a
// sábado), para precargar el formulario de horario del panel la primera vez
// que alguien lo abre — mejor mostrar lo que ya rige que un formulario vacío.
function configHoursForWeek(): DayHoursOverride[] {
  return DAY_NAMES.map((_, dayIdx) => {
    for (const h of clientConfig.contact.hours ?? []) {
      if (dayMatchesLabel(dayIdx, h.day)) {
        return h.closed || !h.open || !h.close ? { closed: true } : { open: h.open, close: h.close };
      }
    }
    return { closed: true };
  });
}

export async function getHoursOverride(): Promise<DayHoursOverride[] | null> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = 'hours' LIMIT 1`;
      return (rows[0]?.value as DayHoursOverride[] | undefined) ?? null;
    },
    () => store().hoursOverride ?? null
  );
}

// `hours` debe traer exactamente 7 posiciones (domingo a sábado, mismo orden
// que Date.getDay()) — lo arma el formulario del panel, no texto libre.
export async function setHoursOverride(hours: DayHoursOverride[]): Promise<void> {
  await withDb(
    async () => {
      const sql = db();
      await sql`
        INSERT INTO settings (key, value) VALUES ('hours', ${jsonb(hours)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    },
    () => {
      store().hoursOverride = [...hours];
    }
  );
}

// Horario a mostrar en el panel: lo guardado, o si nunca se ha tocado, lo que
// ya rige por el config — así el formulario nunca aparece vacío.
export async function effectiveHoursForWeek(): Promise<DayHoursOverride[]> {
  return (await getHoursOverride()) ?? configHoursForWeek();
}

// Duración del servicio según el config (icono/precio/etc.), sin considerar
// aún el override que el dueño pueda haber guardado desde el panel.
function configDurationFor(service: string): number {
  const svc = clientConfig.services.find((s) => s.title === service);
  return svc?.durationMinutes ?? clientConfig.booking?.slotMinutes ?? 60;
}

// Duración efectiva de un servicio: lo que el dueño haya guardado desde el
// panel manda sobre el config (así puede ajustarla sin redesplegar el sitio).
export async function durationFor(service: string): Promise<number> {
  const overrides = await getServiceDurations();
  return overrides[service] ?? configDurationFor(service);
}

export async function getServiceDurations(): Promise<Record<string, number>> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = 'serviceDurations' LIMIT 1`;
      return (rows[0]?.value as Record<string, number>) ?? {};
    },
    () => ({ ...store().serviceDurations })
  );
}

export async function setServiceDurations(durations: Record<string, number>): Promise<void> {
  await withDb(
    async () => {
      const sql = db();
      await sql`
        INSERT INTO settings (key, value) VALUES ('serviceDurations', ${jsonb(durations)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    },
    () => {
      store().serviceDurations = { ...durations };
    }
  );
}

// Precio efectivo de un servicio: lo que el dueño haya guardado desde el panel
// manda sobre el config. Texto libre (igual que en el config: "$5.990",
// "Desde $3.500") — no es el monto que se cobra en ningún pago, solo lo que se
// muestra en la home y en la agenda.
export async function priceFor(service: string): Promise<string | undefined> {
  const overrides = await getServicePrices();
  const configPrice = clientConfig.services.find((s) => s.title === service)?.price;
  return overrides[service] ?? configPrice;
}

export async function getServicePrices(): Promise<Record<string, string>> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = 'servicePrices' LIMIT 1`;
      return (rows[0]?.value as Record<string, string>) ?? {};
    },
    () => ({ ...store().servicePrices })
  );
}

export async function setServicePrices(prices: Record<string, string>): Promise<void> {
  await withDb(
    async () => {
      const sql = db();
      await sql`
        INSERT INTO settings (key, value) VALUES ('servicePrices', ${jsonb(prices)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    },
    () => {
      store().servicePrices = { ...prices };
    }
  );
}

export async function getMaxDailyMinutes(): Promise<number | undefined> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = 'maxDailyMinutes' LIMIT 1`;
      const v = rows[0]?.value as { minutes?: number } | undefined;
      return v?.minutes;
    },
    () => store().maxDailyMinutes
  );
}

export async function setMaxDailyMinutes(minutes: number | undefined): Promise<void> {
  await withDb(
    async () => {
      const sql = db();
      await sql`
        INSERT INTO settings (key, value) VALUES ('maxDailyMinutes', ${jsonb({ minutes })})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    },
    () => {
      store().maxDailyMinutes = minutes;
    }
  );
}

// Tope diario efectivo: lo guardado desde el panel manda sobre el config.
// Sin ninguno de los dos, no hay tope (undefined).
async function effectiveMaxDailyMinutes(): Promise<number | undefined> {
  const override = await getMaxDailyMinutes();
  return override ?? clientConfig.booking?.maxDailyMinutes;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const TZ = "America/Santiago";

// "Ahora + N minutos" expresado en fecha/hora local del negocio, para comparar
// contra los mismos strings "YYYY-MM-DD" / "HH:mm" que usan los slots. La
// aritmética corre sobre el instante UTC (Date.now()) y solo se formatea a
// horario de Chile al final, así que un cambio de horario de verano a mitad de
// camino no desalinea la comparación.
function nowPlusMinutes(minutes: number): { date: string; time: string } {
  const t = new Date(Date.now() + minutes * 60_000);
  return {
    date: new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(t),
    time: new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(t),
  };
}

export async function getMinLeadMinutes(): Promise<number> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = 'min_lead_minutes' LIMIT 1`;
      const v = rows[0]?.value as { minutes?: number } | undefined;
      return v?.minutes ?? 0;
    },
    () => store().minLeadMinutes
  );
}

// Ej: 90 evita que a las 15:50 se pueda reservar el bloque de las 16:00 — solo
// quedan disponibles los horarios a partir de las 17:20. 0 (default) solo
// excluye los horarios que ya pasaron hoy — nunca se ofrece una hora anterior
// a la actual, con o sin mínimo configurado.
export async function setMinLeadMinutes(minutes: number): Promise<void> {
  const clamped = Math.max(0, Math.min(1440, Math.round(minutes)));
  await withDb(
    async () => {
      const sql = db();
      await sql`
        INSERT INTO settings (key, value) VALUES ('min_lead_minutes', ${jsonb({ minutes: clamped })})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    },
    () => {
      store().minLeadMinutes = clamped;
    }
  );
}

// Bloqueos: "YYYY-MM-DD" o "YYYY-MM-DD HH:mm" = bloquea a TODO el negocio (de
// siempre); agregar "|profId" al final escopa el bloqueo a un solo
// profesional (su día libre, sin afectar la agenda de los demás).
function dayBlocked(date: string, profId: string, blocked: Set<string>): boolean {
  return blocked.has(date) || blocked.has(`${date}|${profId}`);
}
function timeBlocked(date: string, time: string, profId: string, blocked: Set<string>): boolean {
  return blocked.has(`${date} ${time}`) || blocked.has(`${date} ${time}|${profId}`);
}

// Genera la grilla de horarios del día PARA UN PROFESIONAL y marca cuáles
// siguen libres. Cada servicio puede durar más de un bloque de la grilla — un
// horario está libre solo si el intervalo completo [t, t+duración) no se
// cruza con ninguna reserva existente DE ESE PROFESIONAL.
function buildSlots(
  date: string,
  durationMinutes: number,
  isBlockedDay: boolean,
  isBlockedTime: (time: string) => boolean,
  taken: { start: number; end: number }[],
  minLeadMinutes: number,
  hoursOverride: DayHoursOverride[] | null
): { time: string; available: boolean }[] {
  if (isBlockedDay) return [];
  const hours = hoursForDate(date, hoursOverride);
  if (!hours) return [];

  // La grilla de horarios de inicio sigue usando slotMinutes (mantiene la UX
  // de horas "redondas"); lo que cambia es cuánto ocupa cada reserva.
  const gridMinutes = clientConfig.booking?.slotMinutes ?? 60;
  // Siempre se calcula (incluso en 0): nunca se ofrece un horario que ya pasó
  // hoy, y con un mínimo configurado además exige ese margen desde ahora.
  const min = nowPlusMinutes(minLeadMinutes);
  const [oh, om] = hours.open.split(":").map(Number);
  const [ch, cm] = hours.close.split(":").map(Number);
  const slots: { time: string; available: boolean }[] = [];
  for (let t = oh * 60 + om; t + durationMinutes <= ch * 60 + cm; t += gridMinutes) {
    const time = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    const end = t + durationMinutes;
    const overlaps = taken.some((iv) => t < iv.end && iv.start < end);
    const tooSoon = date < min.date || (date === min.date && time < min.time);
    slots.push({ time, available: !overlaps && !tooSoon && !isBlockedTime(time) });
  }
  return slots;
}

// Trae reservas y bloqueos del día UNA sola vez (el set es chico — un día de
// un negocio) y los deja indexados por profesional, para no golpear la base
// una vez por candidato al armar la grilla de "cualquiera disponible".
async function dayState(date: string): Promise<{
  takenByProf: Map<string, { start: number; end: number }[]>;
  blocked: Set<string>;
}> {
  return withDb(
    async () => {
      const sql = db();
      const [rows, blockedRows] = await Promise.all([
        sql`SELECT time, duration_minutes, professional_id FROM bookings WHERE date = ${date} AND status <> 'cancelada'`,
        sql`SELECT key FROM blocked_slots WHERE key LIKE ${date + "%"}`,
      ]);
      const takenByProf = new Map<string, { start: number; end: number }[]>();
      for (const r of rows) {
        const profId = String(r.professional_id ?? SHARED_PROFESSIONAL_ID);
        const start = toMinutes(String(r.time));
        const list = takenByProf.get(profId) ?? [];
        list.push({ start, end: start + Number(r.duration_minutes ?? 60) });
        takenByProf.set(profId, list);
      }
      return { takenByProf, blocked: new Set(blockedRows.map((r) => String(r.key))) };
    },
    () => {
      const s = store();
      const takenByProf = new Map<string, { start: number; end: number }[]>();
      for (const b of s.bookings) {
        if (b.date !== date || b.status === "cancelada") continue;
        const start = toMinutes(b.time);
        const list = takenByProf.get(b.professionalId) ?? [];
        list.push({ start, end: start + b.durationMinutes });
        takenByProf.set(b.professionalId, list);
      }
      return { takenByProf, blocked: new Set(s.blocked.filter((k) => k.startsWith(date))) };
    }
  );
}

// `service` es opcional para no romper llamadas existentes (ej. el resumen de
// disponibilidad del chat antes de saber qué servicio quiere el cliente): sin
// él, usa la duración global y considera a todos los profesionales.
//
// `professionalId`: un id específico escopa la grilla a ESE profesional; sin
// él (o "any"), la hora sale disponible si AL MENOS UN profesional elegible
// para el servicio está libre — "cualquiera disponible" del formulario.
export async function slotsForDate(
  date: string,
  service?: string,
  professionalId?: string
): Promise<{ time: string; available: boolean }[]> {
  const durationMinutes = service ? await durationFor(service) : clientConfig.booking?.slotMinutes ?? 60;
  const [minLeadMinutes, hoursOverride, { takenByProf, blocked }] = await Promise.all([
    getMinLeadMinutes(),
    getHoursOverride(),
    dayState(date),
  ]);

  const targetIds =
    professionalId && professionalId !== "any"
      ? [professionalId]
      : (await eligibleProfessionals(service)).map((p) => p.id);

  const perProfessional = targetIds.map((id) =>
    buildSlots(
      date,
      durationMinutes,
      dayBlocked(date, id, blocked),
      (t) => timeBlocked(date, t, id, blocked),
      takenByProf.get(id) ?? [],
      minLeadMinutes,
      hoursOverride
    )
  );

  if (perProfessional.length <= 1) return perProfessional[0] ?? [];
  // Unión: un horario está disponible si lo está para cualquiera de los ids.
  // La grilla (horas de la lista) es idéntica entre profesionales — depende
  // solo de contact.hours/duración, no de reservas — así que alinean por índice.
  return perProfessional[0].map((slot, i) => ({
    time: slot.time,
    available: perProfessional.some((p) => p[i]?.available),
  }));
}

// Suma de minutos ya reservados ese día (todos los servicios, sin contar
// canceladas) — base del tope diario.
async function minutesBookedOn(date: string): Promise<number> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`
        SELECT COALESCE(SUM(duration_minutes), 0) AS total FROM bookings
        WHERE date = ${date} AND status <> 'cancelada'
      `;
      return Number(rows[0]?.total ?? 0);
    },
    () =>
      store()
        .bookings.filter((b) => b.date === date && b.status !== "cancelada")
        .reduce((sum, b) => sum + b.durationMinutes, 0)
  );
}

// Sin tope configurado, siempre "pendiente" (comportamiento de antes). Con
// tope, una reserva que lo supere no se autoconfirma: queda a la espera de que
// el dueño la autorice desde el panel.
async function decideStatus(date: string, durationMinutes: number): Promise<Booking["status"]> {
  const cap = await effectiveMaxDailyMinutes();
  if (!cap) return "pendiente";
  const already = await minutesBookedOn(date);
  return already + durationMinutes > cap ? "pendiente_autorizacion" : "pendiente";
}

export interface CreateBookingInput {
  service: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  // Sin definir o "any": el sistema asigna a quien esté libre a esa hora
  // (el candidato con menos reservas ese día primero, para repartir parejo).
  // Con un id específico, reserva solo con ESE profesional.
  professionalId?: string;
}

async function insertBooking(booking: Booking): Promise<"ok" | "taken" | "db-error"> {
  if (!hasDb()) {
    store().bookings.push(booking);
    return "ok";
  }
  try {
    await ensureSchemaThen(async () => {
      const sql = db();
      await sql`
        INSERT INTO bookings (id, service, date, time, name, phone, status, duration_minutes, professional_id, created_at)
        VALUES (${booking.id}, ${booking.service}, ${booking.date}, ${booking.time},
                ${booking.name}, ${booking.phone}, ${booking.status}, ${booking.durationMinutes},
                ${booking.professionalId}, ${booking.createdAt})
      `;
    });
    return "ok";
  } catch (error) {
    // El índice único (date, time, professional_id) es la última defensa
    // contra dos personas reservando la misma hora con el mismo profesional.
    if (String(error).includes("bookings_slot_unico")) return "taken";
    console.error("[booking-store] createBooking:", error);
    return "db-error";
  }
}

export async function createBooking(data: CreateBookingInput): Promise<Booking | { error: string }> {
  const durationMinutes = await durationFor(data.service);
  const requestedId = data.professionalId && data.professionalId !== "any" ? data.professionalId : null;
  const candidates = requestedId ? [requestedId] : (await eligibleProfessionals(data.service)).map((p) => p.id);
  if (candidates.length === 0) return { error: "Nadie atiende ese servicio todavía." };

  // Menos reservas ese día primero, para repartir el trabajo parejo cuando el
  // cliente elige "cualquiera disponible". Con un profesional pedido a mano,
  // esto no cambia nada (candidates ya tiene un solo elemento).
  const { takenByProf } = await dayState(data.date);
  const ordered = [...candidates].sort(
    (a, b) => (takenByProf.get(a)?.length ?? 0) - (takenByProf.get(b)?.length ?? 0)
  );

  const status = await decideStatus(data.date, durationMinutes);
  let lastError = "Esa hora ya está tomada — elige otra.";

  for (const professionalId of ordered) {
    const slot = (await slotsForDate(data.date, data.service, professionalId)).find((x) => x.time === data.time);
    if (!slot) return { error: "Ese día no hay atención." };
    if (!slot.available) continue;

    const booking: Booking = {
      service: data.service,
      date: data.date,
      time: data.time,
      name: data.name,
      phone: data.phone,
      id: Math.random().toString(36).slice(2, 8).toUpperCase(),
      status,
      durationMinutes,
      professionalId,
      createdAt: new Date().toISOString(),
    };
    const result = await insertBooking(booking);
    if (result === "ok") return booking;
    if (result === "db-error") return { error: "No pudimos registrar la reserva. Intenta de nuevo en unos minutos." };
    // "taken": alguien tomó esa hora con este profesional justo ahora — si
    // pidieron uno específico no hay más candidatos; si era "cualquiera",
    // sigue probando con el resto.
    lastError = "Esa hora acaba de tomarla otra persona — elige otra.";
  }
  return { error: lastError };
}

export async function listBookings(): Promise<Booking[]> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT * FROM bookings ORDER BY date, time`;
      return rows.map((r) => rowToBooking(r as Record<string, unknown>));
    },
    () => [...store().bookings].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  );
}

export async function setBookingStatus(id: string, status: Booking["status"]): Promise<boolean> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`UPDATE bookings SET status = ${status} WHERE id = ${id} RETURNING id`;
      return rows.length > 0;
    },
    () => {
      const b = store().bookings.find((x) => x.id === id);
      if (!b) return false;
      b.status = status;
      return true;
    }
  );
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT * FROM bookings WHERE id = ${id} LIMIT 1`;
      return rows[0] ? rowToBooking(rows[0] as Record<string, unknown>) : undefined;
    },
    () => store().bookings.find((x) => x.id === id)
  );
}

// Abono aprobado por Webpay: registra el pago y confirma la reserva de una vez.
export async function setBookingPaid(
  id: string,
  payment: { amount: number; authorizationCode?: string; cardLast4?: string }
): Promise<boolean> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`
        UPDATE bookings SET payment = ${jsonb(payment)}, status = 'confirmada'
        WHERE id = ${id} RETURNING id
      `;
      return rows.length > 0;
    },
    () => {
      const b = store().bookings.find((x) => x.id === id);
      if (!b) return false;
      b.payment = payment;
      b.status = "confirmada";
      return true;
    }
  );
}

export async function listBlocked(): Promise<string[]> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT key FROM blocked_slots ORDER BY key`;
      return rows.map((r) => String(r.key));
    },
    () => [...store().blocked].sort()
  );
}

export async function getNotify(): Promise<{ email?: string; whatsapp?: string }> {
  return withDb(
    async () => {
      const sql = db();
      const rows = await sql`SELECT value FROM settings WHERE key = 'notify' LIMIT 1`;
      return (rows[0]?.value as { email?: string; whatsapp?: string }) ?? {};
    },
    () => ({ ...store().notify })
  );
}

export async function setNotify(data: { email?: string; whatsapp?: string }): Promise<void> {
  await withDb(
    async () => {
      const current = await getNotify();
      const next = { ...current };
      if (data.email !== undefined) next.email = data.email || undefined;
      if (data.whatsapp !== undefined) next.whatsapp = data.whatsapp || undefined;
      const sql = db();
      await sql`
        INSERT INTO settings (key, value) VALUES ('notify', ${jsonb(next)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    },
    () => {
      const n = store().notify;
      if (data.email !== undefined) n.email = data.email || undefined;
      if (data.whatsapp !== undefined) n.whatsapp = data.whatsapp || undefined;
    }
  );
}

// Tope diario de avisos automáticos. Mantiene el envío dentro de la capa
// gratuita de Resend (100/día) aunque un prospecto pruebe la demo sin parar:
// pasado el tope la reserva se crea igual, solo se omite el aviso.
export async function consumeNotifyQuota(maxPerDay = 20): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  return withDb(
    async () => {
      const sql = db();
      // Un solo upsert atómico: el WHERE hace que la base NO actualice cuando
      // el cupo del día ya se agotó, y entonces RETURNING no devuelve filas.
      const rows = await sql`
        INSERT INTO settings (key, value) VALUES ('notify_quota', ${jsonb({ date: today, sent: 1 })})
        ON CONFLICT (key) DO UPDATE SET value =
          CASE
            WHEN settings.value->>'date' <> ${today} THEN ${jsonb({ date: today, sent: 1 })}
            ELSE jsonb_build_object('date', ${today}::text, 'sent', (settings.value->>'sent')::int + 1)
          END
        WHERE settings.value->>'date' <> ${today} OR (settings.value->>'sent')::int < ${maxPerDay}
        RETURNING value
      `;
      return rows.length > 0;
    },
    () => {
      const s = store();
      if (!s.notifyQuota || s.notifyQuota.date !== today) s.notifyQuota = { date: today, sent: 0 };
      if (s.notifyQuota.sent >= maxPerDay) return false;
      s.notifyQuota.sent++;
      return true;
    }
  );
}

export async function toggleBlocked(key: string): Promise<{ blocked: boolean }> {
  return withDb(
    async () => {
      const sql = db();
      const deleted = await sql`DELETE FROM blocked_slots WHERE key = ${key} RETURNING key`;
      if (deleted.length > 0) return { blocked: false };
      await sql`INSERT INTO blocked_slots (key) VALUES (${key}) ON CONFLICT DO NOTHING`;
      return { blocked: true };
    },
    () => {
      const s = store();
      const i = s.blocked.indexOf(key);
      if (i >= 0) s.blocked.splice(i, 1);
      else s.blocked.push(key);
      return { blocked: i < 0 };
    }
  );
}
