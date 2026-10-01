import { z } from "zod";

export const hourSchema = z.object({
  day: z.string(),
  open: z.string().optional(),
  close: z.string().optional(),
  closed: z.boolean().optional(),
});

export const socialSchema = z.object({
  platform: z.enum(["instagram", "facebook", "tiktok", "linkedin", "x", "youtube", "other"]),
  url: z.string().url(),
  label: z.string().optional(),
});

export const clientConfigSchema = z.object({
  meta: z.object({
    slug: z.string(),
    businessName: z.string(),
    // Texto libre: cada cliente es de un rubro distinto (restaurante, veterinaria,
    // estudio jurídico, ferretería, etc.) — no lo limitamos a una lista fija.
    rubro: z.string(),
    locale: z.string().default("es-CL"),
  }),

  // Acceso a los paneles /agenda/admin y /tienda/admin. Con esto definido, cada
  // persona entra con su cuenta de Google (botón "Iniciar sesión con Google")
  // en vez de compartir una clave por URL — ver lib/auth.ts. Ausente = el panel
  // sigue funcionando solo con AGENDA_ADMIN_KEY (?clave=...), como antes.
  //
  // "admin" ve y edita todo (config del negocio, avisos, tope diario,
  // anticipación mínima) además de las reservas. "staff" (ej. cada barbero o
  // peluquera) solo puede confirmar/cancelar reservas y bloquear horarios en
  // /agenda/admin — no ve /tienda/admin ni la configuración del negocio. Cada
  // acción de un "staff" le llega avisada al admin (mismo canal de avisos de
  // reservas nuevas).
  admin: z
    .object({
      users: z
        .array(
          z.object({
            email: z.string().email(),
            name: z.string().optional(),
            role: z.enum(["admin", "staff"]).default("admin"),
          })
        )
        .min(1),
    })
    .optional(),

  branding: z.object({
    logoUrl: z.string(),
    faviconUrl: z.string().optional(),
    palette: z.object({
      primary: z.string(),
      accent: z.string(),
      background: z.string(),
      foreground: z.string().default("#111111"),
    }),
    fontPairing: z.enum(["modern", "elegante", "amigable"]),
    // true cuando el archivo del logo ya trae el nombre del negocio escrito —
    // el header muestra solo el logo, sin repetir el nombre en texto al lado.
    logoIncludesName: z.boolean().default(false),
    // Layout de la home según el rubro, para que no todos los sitios se vean
    // iguales: "clasico" (cards centradas, el original), "inmobiliaria" (hero
    // full-screen con la propiedad como protagonista, estilo corretaje premium)
    // y "corporativo" (banda sobria, áreas numeradas, estilo estudio de
    // abogados/consultora).
    layout: z.enum(["clasico", "inmobiliaria", "corporativo"]).default("clasico"),
    // Crédito de autoría en el pie ("Sitio por HarayaDev"). Es autoría, no
    // dependencia: el sitio es del cliente y sigue funcionando igual sin esto.
    // Por eso viene APAGADO por defecto — se enciende cuando el cliente lo
    // aprueba. En las demos va siempre encendido (son nuestras).
    credit: z.boolean().default(false),
    // Cómo se llama la sección de precios en el menú, el encabezado y el pie
    // (ej. "Valores", "Tarifas"). El ancla se deriva del nombre (#valores).
    pricingLabel: z.string().default("Precios"),
  }),

  hero: z.object({
    title: z.string(),
    subtitle: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    backgroundImageUrl: z.string().optional(),
    // Crédito de la foto de fondo cuando su licencia lo exige (ej. CC BY).
    backgroundImageCredit: z.object({ text: z.string(), href: z.string().url() }).optional(),
    // Sellos cortos bajo el subtítulo (ej. "Asesoría legal en cada operación").
    badges: z.array(z.string()).max(4).optional(),
  }),

  services: z
    .array(
      z.object({
        // Nombre de cualquier ícono de lucide-react (ej. "UtensilsCrossed", "Scissors",
        // "Scale"). Se resuelve dinámicamente, así que no hay una lista cerrada de íconos.
        icon: z.string(),
        title: z.string(),
        description: z.string(),
        price: z.string().optional(),
        // Duración en minutos de ESTE servicio. Si no se define, usa
        // booking.slotMinutes (mismo comportamiento que antes de este campo).
        // El dueño puede sobreescribirla desde el panel sin tocar el config.
        durationMinutes: z.number().int().positive().optional(),
      })
    )
    .max(12)
    .default([]),

  about: z.object({
    title: z.string(),
    body: z.string(),
    imageUrl: z.string().optional(),
  }),

  gallery: z.array(z.object({ url: z.string(), alt: z.string() })).max(20).optional(),

  contact: z
    .object({
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      whatsappPrefilledMessage: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
      mapQuery: z.string().optional(),
      hours: z.array(hourSchema).optional(),
      socials: z.array(socialSchema).optional(),
      extraLinks: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
    })
    .refine((c) => Boolean(c.whatsapp || c.phone || c.email), {
      message: "Debe existir al menos un medio de contacto (whatsapp, phone o email)",
    }),

  modules: z.object({
    contactForm: z.boolean().default(true),
    whatsappButton: z.boolean().default(true),
    testimonials: z.boolean().default(false),
    faq: z.boolean().default(false),
    pricing: z.boolean().default(false),
    chat: z.boolean().default(true),
    // Módulo CMS de propiedades (vertical inmobiliario): páginas /propiedades con
    // búsqueda y filtros, ficha por propiedad con galería y video, y el chat IA
    // respondiendo sobre el inventario. Se activa/desactiva por cliente.
    propiedades: z.boolean().default(false),
    // Plan Inmobiliaria (panel multi-corredor): /inmobiliaria/admin para que la
    // dueña de la agencia gestione corredoras, propiedades, clientes, el
    // directorio de proveedores de confianza, informes de entrega/recepción y
    // contratos con plantillas propias. Independiente de `propiedades` (esa es
    // la vitrina pública; esta es el panel operativo). Requiere DATABASE_URL
    // para persistir entre despliegues — ver lib/realestate-store.ts.
    inmobiliariaAdmin: z.boolean().default(false),
    // Módulo agenda online: /agenda para que el cliente final reserve hora (queda
    // "pendiente de abono"), panel del dueño en /agenda/admin (confirmar, revisar,
    // bloquear días/horas) y aviso por email de cada reserva nueva.
    agenda: z.boolean().default(false),
    // Módulo tienda online: /tienda con catálogo y carrito, checkout con Webpay
    // Plus (Transbank). Sin env vars corre contra el ambiente de integración de
    // Transbank (pago de prueba, flujo completo visible); producción se activa
    // con TBK_ENV=produccion + TBK_COMMERCE_CODE + TBK_API_KEY.
    tienda: z.boolean().default(false),
  }),

  // Configuración del módulo agenda (requiere modules.agenda).
  booking: z
    .object({
      // Duración de cada bloque reservable, en minutos. Los horarios disponibles
      // se derivan de contact.hours — no se configuran dos veces.
      slotMinutes: z.number().default(60),
      // Cuántos días hacia adelante se puede reservar.
      daysAhead: z.number().default(14),
      // Texto del abono obligatorio que ve el cliente al reservar.
      depositNote: z
        .string()
        .default("Para confirmar tu hora se solicita un abono. Te contactaremos con los datos de transferencia."),
      // Monto del abono en CLP (entero). Si se define, al reservar aparece el
      // botón "Pagar abono con Webpay" y la reserva se confirma sola con el pago
      // aprobado (misma integración lib/webpay.ts del módulo tienda). Si no se
      // define, el abono se coordina por transferencia como siempre.
      depositAmount: z.number().int().positive().optional(),
      // WhatsApp del negocio para avisos gratuitos (wa.me en correos / panel).
      // No requiere API de Meta: al llegar una reserva, el correo incluye un enlace
      // wa.me que abre WhatsApp con el resumen listo para enviar.
      ownerNotifyWhatsapp: z.string().optional(),
      ownerNotifyEmail: z.string().email().optional(),
      // Tope de minutos reservables por día, sumando TODOS los servicios. Si se
      // supera, la reserva no se confirma sola: queda "pendiente_autorizacion"
      // hasta que el dueño la autorice desde el panel. Sin definir, no hay tope.
      // El dueño puede cambiarlo desde el panel sin tocar el config.
      maxDailyMinutes: z.number().int().positive().optional(),
    })
    .optional(),

  // Profesionales que atienden en la agenda (requiere modules.agenda). Ausente
  // o vacío = agenda compartida de siempre, un solo calendario para todo el
  // negocio — nada de esto es obligatorio. Con 2+ profesionales, el cliente
  // elige con quién reservar (o "cualquiera disponible") y cada quien tiene su
  // propia disponibilidad independiente — ver lib/booking-store.ts.
  professionals: z
    .array(
      z.object({
        // Estable: no cambiar aunque cambie el nombre — identifica sus reservas
        // pasadas y presentes. Usar algo simple tipo "juan", "camila".
        id: z.string(),
        name: z.string(),
        photoUrl: z.string().optional(),
        // Títulos de servicios que atiende (deben calzar con services[].title).
        // Vacío o ausente = atiende todos los servicios.
        services: z.array(z.string()).optional(),
        // Si tiene login (ver admin.users), debe ser EXACTAMENTE el mismo correo
        // — así su sesión se calza con "sus" reservas en el panel.
        email: z.string().email().optional(),
      })
    )
    .optional(),

  // Catálogo de la tienda (requiere modules.tienda). Igual que properties: en la
  // demo/MVP vive en el config; en producción se administra vía panel o mantención.
  store: z
    .object({
      products: z
        .array(
          z.object({
            slug: z.string(),
            name: z.string(),
            // Precio en CLP, entero: Webpay opera montos enteros en pesos.
            price: z.number().int().positive(),
            description: z.string(),
            imageUrl: z.string().optional(),
            category: z.string().optional(),
            available: z.boolean().default(true),
          })
        )
        .max(200),
      // Se muestra en el checkout y en la confirmación del pedido.
      shippingNote: z
        .string()
        .default("Después del pago coordinamos la entrega o el retiro por WhatsApp."),
    })
    .optional(),

  // Inventario de propiedades (requiere modules.propiedades). En la demo/MVP vive
  // en el config; en producción se administra desde el panel (fase CMS con DB) o
  // vía mantención mensual — el resto del sitio no cambia.
  properties: z
    .array(
      z.object({
        slug: z.string(),
        title: z.string(),
        operation: z.enum(["venta", "arriendo", "arriendo_temporada"]),
        type: z.enum(["casa", "departamento", "oficina", "local", "terreno", "parcela", "bodega", "estacionamiento"]),
        comuna: z.string(),
        // Texto libre para soportar UF y CLP: "UF 4.500", "$650.000/mes".
        price: z.string(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        area: z.number().optional(),
        parking: z.number().optional(),
        description: z.string(),
        images: z.array(z.string()).min(1),
        // URL de YouTube (watch o youtu.be); se embebe en la ficha.
        // Link de YouTube o de un reel de Instagram; se reproduce en la ficha.
        video: z.string().optional(),
        featured: z.boolean().default(false),
        // Propiedad que solo gestiona esta corredora: se destaca en la sección
        // "En Exclusiva" de la home y lleva el sello en su tarjeta y ficha.
        exclusive: z.boolean().default(false),
      })
    )
    .max(200)
    .optional(),

  // Servicios de sindicación activables por cliente. En la demo se muestran como
  // sello en cada ficha ("se publica también en…"); la integración real (API de
  // MercadoLibre para Portalinmobiliario, Graph API para Instagram, Content
  // Posting API para TikTok) se habilita por cliente en la implementación.
  syndication: z
    .object({
      portalinmobiliario: z.boolean().default(false),
      instagram: z.boolean().default(false),
      tiktok: z.boolean().default(false),
      // Mención genérica "y en otros portales inmobiliarios" (sin nombrarlos).
      otherPortals: z.boolean().default(false),
    })
    .optional(),

  // Pilares del negocio: franja de 3-4 diferenciadores bajo el hero (layout
  // inmobiliaria). `icon` = nombre de un ícono de lucide-react.
  pillars: z.array(z.object({ icon: z.string(), title: z.string(), text: z.string() })).max(4).optional(),

  // Asesores del equipo (sección "Nuestros asesores"). Sin foto se muestra un
  // monograma con sus iniciales.
  team: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        photoUrl: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        // Número en formato internacional sin "+", para el link de WhatsApp.
        whatsapp: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .optional(),

  testimonials: z
    .array(
      z.object({
        name: z.string(),
        quote: z.string(),
        rating: z.number().min(1).max(5).optional(),
      })
    )
    .optional(),

  faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),

  pricing: z
    .array(
      z.object({
        name: z.string(),
        price: z.string(),
        features: z.array(z.string()),
        highlighted: z.boolean().optional(),
      })
    )
    .optional(),

  chat: z.object({
    businessDescription: z.string(),
    qaPairs: z.array(z.object({ q: z.string(), a: z.string() })).max(40).default([]),
    // gemini-*-flash gasta la mayoría del budget de tokens en "thinking" interno
    // antes de responder, truncando respuestas cortas. flash-lite no tiene ese
    // overhead y usa la misma cuota gratuita. 2026-08-28: gemini-2.5-flash-lite
    // dejó de estar disponible para API keys nuevas (404 "no longer available
    // to new users" — keys viejas lo siguen sirviendo igual, confirmado en
    // vivo), Google recomienda 3.5-flash-lite como reemplazo directo.
    model: z.string().default("gemini-3.5-flash-lite"),
    maxTokensPerReply: z.number().default(500),
    fallbackToWhatsapp: z.boolean().default(true),
    systemPromptExtra: z.string().optional(),
  }),

  // Variantes de paleta para mostrar al cliente en /variantes ("¿cuál te gusta
  // más: A, B o C?"). Opcional: si no se define, /variantes explica cómo usarlas.
  // `npm run palette -- logo.png` sugiere estas variantes automáticamente.
  themeVariants: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        palette: z.object({
          primary: z.string(),
          accent: z.string(),
          background: z.string(),
          foreground: z.string(),
        }),
      })
    )
    .max(6)
    .optional(),

  // Ley 21.719 (protección de datos, Chile, vigencia 1-dic-2026): ver
  // lib/privacy.ts para los plazos por defecto y docs/registro-actividades-
  // tratamiento.md para el detalle completo. Todo opcional — sin definir nada
  // acá, el sitio igual cumple con los plazos por defecto.
  privacy: z
    .object({
      // Canal para solicitudes ARCO+ (acceso, rectificación, cancelación,
      // oposición, portabilidad, bloqueo). Ausente = usa contact.email.
      arcoEmail: z.string().email().optional(),
      // Override de plazos de retención en meses por tipo de dato, si el
      // rubro del cliente exige algo distinto a los defaults documentados.
      retentionMonths: z
        .object({
          bookings: z.number().int().positive().optional(),
          leads: z.number().int().positive().optional(),
          chatLogs: z.number().int().positive().optional(),
          waThreads: z.number().int().positive().optional(),
          orders: z.number().int().positive().optional(),
          realEstateDeliveries: z.number().int().positive().optional(),
          realEstateContracts: z.number().int().positive().optional(),
        })
        .optional(),
    })
    .optional(),

  seo: z.object({
    title: z.string(),
    description: z.string(),
    ogImageUrl: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    // Subtipo de schema.org (Restaurant, HairSalon, LegalService, Store, etc.)
    businessType: z.string().default("LocalBusiness"),
    priceRange: z.string().optional(),
    // Datos para el JSON-LD del negocio (Google, Maps y buscadores con IA).
    postalAddress: z
      .object({
        streetAddress: z.string().optional(),
        addressLocality: z.string(),
        addressRegion: z.string().optional(),
        addressCountry: z.string().default("CL"),
      })
      .optional(),
    // Comunas/ciudades donde opera — clave para búsquedas locales.
    areaServed: z.array(z.string()).optional(),
    knowsAbout: z.array(z.string()).optional(),
    founder: z.string().optional(),
    founderJobTitle: z.string().optional(),
  }),
});

export type ClientConfig = z.infer<typeof clientConfigSchema>;

export function defineClientConfig(config: z.input<typeof clientConfigSchema>): ClientConfig {
  return clientConfigSchema.parse(config);
}
