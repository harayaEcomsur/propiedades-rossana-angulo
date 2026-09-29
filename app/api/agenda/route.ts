import { z } from "zod";
import { clientConfig } from "@/config/client.config";
import {
  slotsForDate,
  listBookings,
  setBookingStatus,
  getBooking,
  listBlocked,
  toggleBlocked,
  getNotify,
  setNotify,
  consumeNotifyQuota,
  getServiceDurations,
  setServiceDurations,
  getServicePrices,
  setServicePrices,
  getMaxDailyMinutes,
  setMaxDailyMinutes,
  getMinLeadMinutes,
  setMinLeadMinutes,
  eligibleProfessionals,
  professionalIdForEmail,
  multiProfessionalEnabled,
  getProfessionalsOverride,
  setProfessionalsOverride,
  effectiveHoursForWeek,
  setHoursOverride,
  type Professional,
} from "@/lib/booking-store";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  createBookingAndNotify,
  notifyByEmail,
  notifyByWhatsApp,
  notifyTargets,
  notifyAdminOfStaffAction,
  emailWithWaLinks,
  defaultOwnerWhatsapp,
} from "@/lib/booking-actions";
import { currentAgendaUser, currentAdminUser, type SessionUser } from "@/lib/auth";

// API del módulo agenda. GET público entrega disponibilidad (de un
// profesional, o la unión de todos si no se pide uno); con sesión (Google o
// clave heredada) entrega además las reservas — admin ve las de todos y la
// configuración del negocio, staff solo las suyas. POST crea una reserva
// (queda "pendiente" hasta el abono) y avisa por email. PATCH: confirmar/
// cancelar reservas y bloquear horarios lo puede hacer admin (cualquiera) o
// staff (solo lo suyo, y avisa al admin); cambiar configuración del negocio
// requiere admin.
export const runtime = "nodejs";

// El clave heredado viaja por header (fetch del panel) o por query (link
// directo /agenda/admin?clave=...) — ambos casos posibles según quién llame.
function claveFromRequest(req: Request): string | null {
  return req.headers.get("x-agenda-key") ?? new URL(req.url).searchParams.get("clave");
}

// null cuando la sesión es admin (ve todo), la clave heredada (siempre admin),
// o el negocio no usa profesionales — no hay "propio" que filtrar.
async function myProfessionalId(user: SessionUser): Promise<string | null> {
  if (user.role !== "staff") return null;
  return professionalIdForEmail(user.email);
}

export async function GET(req: Request) {
  if (!clientConfig.modules.agenda) return Response.json({ error: "Agenda no habilitada" }, { status: 404 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date");

  const user = await currentAgendaUser(claveFromRequest(req));
  if (user) {
    const [mine, allBookings, enabled] = await Promise.all([
      myProfessionalId(user),
      listBookings(),
      multiProfessionalEnabled(),
    ]);
    const base = {
      role: user.role,
      myProfessionalId: mine,
      professionals: enabled ? await eligibleProfessionals() : [],
      bookings: mine ? allBookings.filter((b) => b.professionalId === mine) : allBookings,
      blocked: await listBlocked(),
    };
    if (user.role !== "admin") return Response.json(base);

    const n = await getNotify();
    return Response.json({
      ...base,
      notify: {
        email: n.email ?? clientConfig.booking?.ownerNotifyEmail ?? process.env.BOOKINGS_NOTIFY_EMAIL ?? null,
        whatsapp: n.whatsapp ?? defaultOwnerWhatsapp() ?? null,
        whatsappReady: Boolean(process.env.NOTIFY_WA_TOKEN && process.env.NOTIFY_WA_PHONE_ID),
        whatsappMode: process.env.NOTIFY_WA_TOKEN && process.env.NOTIFY_WA_PHONE_ID ? "api" : "wame",
      },
      serviceDurations: await getServiceDurations(),
      servicePrices: await getServicePrices(),
      maxDailyMinutes: (await getMaxDailyMinutes()) ?? clientConfig.booking?.maxDailyMinutes ?? null,
      minLeadMinutes: await getMinLeadMinutes(),
      // Roster completo (con email y servicios) para poder editarlo — el
      // roster PÚBLICO de ?professionals=1 no expone email.
      professionalsFull: (await getProfessionalsOverride()) ?? clientConfig.professionals ?? [],
      hours: await effectiveHoursForWeek(),
    });
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const service = url.searchParams.get("service") ?? undefined;
    const professional = url.searchParams.get("professional") ?? undefined;
    return Response.json({ date, slots: await slotsForDate(date, service, professional) });
  }
  if (url.searchParams.get("professionals") === "1") {
    // Roster público (nombre + a qué servicios atiende) para el paso "elige
    // profesional" del formulario — sin datos sensibles (nunca el email).
    const service = url.searchParams.get("service") ?? undefined;
    const [enabled, list] = await Promise.all([multiProfessionalEnabled(), eligibleProfessionals(service)]);
    return Response.json({
      enabled,
      professionals: list.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl })),
    });
  }
  return Response.json({ error: "Falta ?date=YYYY-MM-DD" }, { status: 400 });
}

const createSchema = z.object({
  service: z.string().min(2).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(20),
  professionalId: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  if (!clientConfig.modules.agenda) return Response.json({ error: "Agenda no habilitada" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 400 });

  const result = await createBookingAndNotify(parsed.data);
  if (!result.ok) return Response.json({ error: result.error }, { status: 409 });

  return Response.json({
    ok: true,
    booking: result.booking,
    emailSent: result.emailSent,
    whatsappSent: result.whatsappSent,
    waNotifyUrl: result.waNotifyUrl,
    depositNote: result.depositNote,
  });
}

const patchSchema = z.union([
  z.object({
    action: z.literal("status"),
    id: z.string(),
    status: z.enum(["confirmada", "cancelada", "pendiente", "pendiente_autorizacion"]),
  }),
  z.object({ action: z.literal("toggleBlock"), key: z.string().min(10).max(80) }),
  z.object({
    action: z.literal("setNotify"),
    email: z.string().email().or(z.literal("")).optional(),
    whatsapp: z.string().max(20).optional(),
  }),
  z.object({ action: z.literal("testNotify") }),
  z.object({
    action: z.literal("serviceConfig"),
    durations: z.record(z.string(), z.number().int().positive()).optional(),
    prices: z.record(z.string(), z.string().max(40)).optional(),
    maxDailyMinutes: z.number().int().positive().nullable().optional(),
    minLeadMinutes: z.number().int().min(0).max(1440).optional(),
  }),
  z.object({
    action: z.literal("setProfessionals"),
    professionals: z.array(
      z.object({
        id: z.string().min(1).max(60),
        name: z.string().min(1).max(80),
        email: z.string().email().or(z.literal("")).optional(),
        services: z.array(z.string()).optional(),
      })
    ),
  }),
  z.object({
    // 7 posiciones, domingo a sábado (mismo orden que Date.getDay()).
    action: z.literal("setHours"),
    hours: z
      .array(z.object({ open: z.string().optional(), close: z.string().optional(), closed: z.boolean().optional() }))
      .length(7),
  }),
]);

// Acciones sobre reservas/bloqueos: admin o staff. El resto (config del
// negocio) es solo admin — se valida aparte, más abajo.
const STAFF_ALLOWED_ACTIONS = new Set(["status", "toggleBlock"]);

export async function PATCH(req: Request) {
  if (!clientConfig.modules.agenda) return Response.json({ error: "Agenda no habilitada" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 400 });

  const clave = claveFromRequest(req);
  let user: SessionUser | null;
  if (STAFF_ALLOWED_ACTIONS.has(parsed.data.action)) {
    user = await currentAgendaUser(clave);
  } else {
    user = await currentAdminUser(clave);
  }
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });
  const mine = await myProfessionalId(user);

  if (parsed.data.action === "status") {
    // Staff con profesionales activos: solo puede tocar SUS reservas — nunca
    // confiar en el body para esto, se valida contra lo que ya está guardado.
    if (mine) {
      const booking = await getBooking(parsed.data.id);
      if (!booking || booking.professionalId !== mine) {
        return Response.json({ error: "Esa reserva no es tuya." }, { status: 403 });
      }
    }
    const ok = await setBookingStatus(parsed.data.id, parsed.data.status);
    if (ok && user.role === "staff") {
      await notifyAdminOfStaffAction(user.email, `cambió la reserva ${parsed.data.id} a "${parsed.data.status}"`);
    }
    return Response.json({ ok });
  }
  if (parsed.data.action === "setNotify") {
    await setNotify({ email: parsed.data.email, whatsapp: parsed.data.whatsapp });
    return Response.json({ ok: true });
  }
  if (parsed.data.action === "setProfessionals") {
    const list: Professional[] = parsed.data.professionals.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email || undefined,
      services: p.services?.length ? p.services : undefined,
    }));
    await setProfessionalsOverride(list);
    return Response.json({ ok: true });
  }
  if (parsed.data.action === "setHours") {
    await setHoursOverride(parsed.data.hours);
    return Response.json({ ok: true });
  }
  if (parsed.data.action === "serviceConfig") {
    if (parsed.data.durations) await setServiceDurations(parsed.data.durations);
    if (parsed.data.prices) await setServicePrices(parsed.data.prices);
    if (parsed.data.maxDailyMinutes !== undefined) {
      await setMaxDailyMinutes(parsed.data.maxDailyMinutes ?? undefined);
    }
    if (parsed.data.minLeadMinutes !== undefined) {
      await setMinLeadMinutes(parsed.data.minLeadMinutes);
    }
    return Response.json({ ok: true });
  }
  if (parsed.data.action === "testNotify") {
    const targets = await notifyTargets();
    const text = `Aviso de prueba de la agenda de ${clientConfig.meta.businessName} — así te llegará cada reserva nueva ✅`;
    const quotaOk = await consumeNotifyQuota();
    const waMeUrl =
      targets.whatsapp && targets.whatsapp.replace(/\D/g, "").length >= 8
        ? buildWhatsAppLink(targets.whatsapp, text)
        : null;
    const [emailSent, whatsappSent] = await Promise.all([
      quotaOk
        ? notifyByEmail(
            `🔔 Prueba de avisos — ${clientConfig.meta.businessName}`,
            emailWithWaLinks(
              text,
              {
                id: "DEMO",
                service: clientConfig.services[0]?.title ?? "Servicio",
                date: new Date().toISOString().slice(0, 10),
                time: "11:00",
                name: "Camila R.",
                phone: "+56 9 5555 1111",
                status: "pendiente",
                durationMinutes: clientConfig.booking?.slotMinutes ?? 60,
              },
              targets
            ),
            targets.email
          )
        : Promise.resolve(false),
      quotaOk && targets.whatsapp && process.env.NOTIFY_WA_TOKEN
        ? notifyByWhatsApp(targets.whatsapp, text)
        : Promise.resolve(false),
    ]);
    return Response.json({ ok: true, emailSent, whatsappSent, waMeUrl });
  }

  // toggleBlock: el staff SIEMPRE bloquea solo lo suyo — se ignora cualquier
  // scope que venga en el body y se fuerza el propio id, así nunca puede
  // terminar bloqueando (a propósito o por error del cliente) toda la agenda.
  const key = mine ? `${parsed.data.key.split("|")[0]}|${mine}` : parsed.data.key;
  const result = await toggleBlocked(key);
  if (user.role === "staff") {
    await notifyAdminOfStaffAction(user.email, `${result.blocked ? "bloqueó" : "desbloqueó"} el horario ${key}`);
  }
  return Response.json({ ok: true, ...result });
}
