// Registro multi-tenant del ASISTENTE EMBEBIBLE (add-on IA sobre el sitio que el
// cliente YA tiene). Es un camino aparte del sitio single-tenant por branch: el
// mismo despliegue de HarayaDev atiende a varios negocios ajenos, resueltos por
// `tenantId`. Aislado a propósito de `client.config` y de `/api/chat` para no
// tocar las demos vivas.
//
// Estado: conocimiento conversacional + derivación a WhatsApp + captura de
// contacto por tenant + agenda por tenant con verdad de servidor (disponibilidad
// y reservas, persistidas en Postgres si hay DATABASE_URL; ver lib/embed-agenda.ts).
// Pendiente del siguiente slice: tienda/pedido por tenant y aislamiento de
// secretos de pago por tenant (Webpay propio por cliente) — ver diferenciador-vs-darwin.md.

export interface EmbedTenant {
  id: string;
  businessName: string;
  rubro: string;
  // Qué hace el negocio, en una o dos frases.
  description: string;
  // Conocimiento en texto libre: horarios, precios, servicios, ubicación,
  // políticas. Es la "verdad" contra la que responde el asistente en el MVP.
  facts: string;
  // Para derivar cuando el asistente no sabe o piden hablar con una persona, y
  // como destino del aviso de contacto al dueño por WhatsApp (desde el número de
  // HarayaDev, si hay NOTIFY_WA_TOKEN).
  whatsapp?: string;
  // Email del dueño del negocio: destino del aviso cuando el asistente captura un
  // contacto/lead. Si se omite, cae a BOOKINGS_NOTIFY_EMAIL (o no envía email).
  ownerNotifyEmail?: string;
  // Orígenes permitidos para CORS (el/los dominios del sitio del cliente). Si se
  // omite, el endpoint refleja el Origin (útil en demos); en producción conviene
  // acotarlo al dominio real del cliente.
  allowedOrigins?: string[];
  // Modelo por tenant (opcional). Por defecto gemini-3.5-flash-lite (barato, ok
  // para conversar). OJO: para tenants con `agenda`/tools de escritura usa
  // gemini-2.5-flash — el -lite es demasiado débil decidiendo llamar la tool de
  // reserva (conversa y "confirma" sin ejecutarla). Verificado en vivo.
  model?: string;
  // Emojis en las respuestas (opcional, default false). Off por defecto porque
  // no calza con todos los rubros (una clínica dental/estética no quiere el
  // mismo tono que una barbería o un salón) — se activa por tenant según su
  // propia marca, nunca por defecto.
  useEmojis?: boolean;
  // Globo que invita a hacer clic en el botón del widget (opcional). Sin
  // esto, widget.js usa un texto genérico — este es solo para darle un tono
  // propio del rubro (más conversión que el genérico, nunca obligatorio).
  teaserMessage?: string;
  // Agenda conversacional por tenant (opcional). Si está, el asistente puede
  // consultar disponibilidad REAL y crear reservas (nunca inventa horarios). El
  // motor vive en lib/embed-agenda.ts, aislado del booking-store single-tenant.
  agenda?: {
    // Servicios reservables (nombres tal como los ve el cliente).
    services: string[];
    // Horario de atención, mismo formato que client.config.contact.hours:
    // etiquetas como "Lunes a viernes", "Martes a sábado", "Sábado".
    hours: { day: string; open?: string; close?: string; closed?: boolean }[];
    // Duración de cada hora reservable en minutos (default 60).
    slotMinutes?: number;
    // Cuántos días hacia adelante se puede reservar (default 14).
    daysAhead?: number;
  };
  // Agenda EXTERNA (opcional, mutuamente excluyente con `agenda`): para
  // tenants que YA reservan en un sistema externo con API real. En vez de
  // nuestro motor propio (lib/embed-agenda.ts), el asistente consulta y
  // reserva directo en la cuenta real del cliente. El token vive SOLO en una
  // env var namespaced por tenant (nunca acá) — sin ella, estas tools no se
  // activan y el tenant queda sin agenda conversacional (solo deriva).
  externalAgenda?:
    | {
        // Dentalink: NO es autoservicio — el cliente debe pagarle a Dentalink
        // por el add-on de API antes de poder generar su token (ver
        // lib/embed-dentalink.ts). Token en DENTALINK_TOKEN_<ID>.
        provider: "dentalink";
        idSucursal: number;
        idEspecialidad: number;
        // Si se omite, se reserva sin fijar profesional (Dentalink asigna uno
        // con agenda online habilitada para esa especialidad/sucursal).
        idDentista?: number;
        duracionMin: number;
      }
    | {
        // AgendaPro: SÍ es autoservicio — el cliente genera su propia API key
        // desde Configuraciones > Integraciones en su cuenta, con los scopes
        // bookings:read, bookings:write y clients:write (ver
        // lib/embed-agendapro.ts). Token en AGENDAPRO_TOKEN_<ID>.
        provider: "agendapro";
        idLocation: number;
        idService: number;
        // Si se omite, se reserva con el primer profesional que devuelva
        // disponibilidad para ese servicio/sucursal.
        idProvider?: number;
      };
  // Tienda por tenant (opcional). Si está, el asistente puede armar un pedido y
  // entregar link de pago Webpay. Los precios se resuelven en el servidor desde
  // este catálogo (nunca desde el modelo). El aislamiento de la plata (Transbank
  // propio por cliente) va por env vars namespaced — ver lib/embed-webpay.ts.
  store?: {
    products: {
      slug: string;
      name: string;
      price: number; // CLP entero
      description?: string;
      category?: string;
      available?: boolean; // default true
    }[];
    shippingNote?: string;
  };
  // Concierge sobre una tienda Shopify REAL del cliente (mutuamente excluyente
  // con `store`): el asistente busca en su catálogo en vivo y agrega productos
  // al carrito de esa visita — ver lib/embed-shopify.ts. No requiere ningún
  // token del cliente (endpoints públicos de Shopify), pero SOLO funciona
  // agregando al carrito de verdad una vez que el widget está instalado en el
  // dominio real de la tienda (el carrito es same-origin) — probado con
  // fetch directo a los endpoints y con /cart/add.js ejecutado en el propio
  // sitio, nunca desde un origen distinto.
  shopify?: {
    domain: string; // ej. "yukipet.cl" (el dominio donde vive/vivirá el widget)
  };
  // Branding real del sitio del PROSPECTO, solo para /embed/demo (nunca se usa
  // en el chat en sí). Sin esto la página de demo se ve neutra; con esto usa
  // su logo/colores/imagen real para que la vista previa se sienta como su
  // propio sitio. Igual que `facts`: nunca inventar estos valores — sacarlos
  // inspeccionando el sitio real (DOM/CSS), no adivinarlos.
  demoBranding?: {
    primaryColor: string; // hex — color de marca principal (títulos/acentos)
    accentColor?: string; // hex — color secundario si el sitio tiene dos (se usa en el bubble del widget)
    logoUrl: string; // URL real del logo (hotlink al propio sitio del prospecto)
    heroImageUrl?: string; // URL real de una foto/banner de su sitio, de fondo
  };
}

const TENANTS: Record<string, EmbedTenant> = {
  // <nuevo-tenant-aquí> — no borres este comentario: `npm run embed-tenant -- --write` inserta acá.
  // Datos tomados de premiumdental.cl (home, /tratamientos-dentales, /tienda,
  // /contacto) el 2026-09-01 — prospecto, sitio aún no instalado. Sin sistema
  // de reservas propio: el sitio real solo deriva a WhatsApp/contacto ("Agenda
  // tu evaluación hoy mismo" abre el contacto, no un calendario) — este chat
  // tampoco agenda directo, junta los datos y usa registrar_contacto. Precios
  // reales publicados SOLO para las 4 ofertas de /tienda; el resto de
  // tratamientos no tiene precio público — nunca inventarlo.
  "premium-dental": {
    id: "premium-dental",
    businessName: "Premium Dental",
    rubro: "clínica dental",
    description:
      "Premium Dental — clínica dental en Santiago Centro, acreditada por la SEREMI de Salud. Atiende endodoncia, extracciones, ortodoncia, odontopediatría, prostodoncia, periodoncia y cirugía oral y maxilofacial.",
    facts: [
      "Especialidades: Endodoncia, Extracciones, Ortodoncia, Odontopediatría, Prostodoncia, Periodoncia, Cirugía Oral y Maxilofacial. También atiende urgencias dentales.",
      "Ofertas con precio publicado (CLP):",
      "- Tapaduras Dentales — desde $35.000",
      "- Carillas Dentales — desde $64.900",
      "- Prótesis Dental — desde $275.000",
      "- Implante Dental + Corona — oferta $655.000 (antes $850.000)",
      "Otros tratamientos (blanqueamiento dental, limpieza dental, brackets/ortodoncia, combos blanqueamiento+limpieza) NO tienen precio publicado — nunca lo inventes, indica que se cotiza en la evaluación.",
      "Horario: Lunes a viernes 09:00 a 18:00, sábado 09:00 a 14:00.",
      "Ubicación: Moneda 812, oficina 1003, Santiago Centro (Región Metropolitana).",
      "Contacto: WhatsApp +56 9 2050 5996, email servicios@premiumdental.cl, Instagram @premiumdental.cl.",
      "Acreditada por la SEREMI de Salud.",
      "El sitio no tiene sistema de reservas propio: 'Agenda tu evaluación hoy mismo' deriva a contacto/WhatsApp, no a un calendario. Este chat tampoco agenda directo — si alguien quiere hora, junta nombre, teléfono y el tratamiento de interés, y usa registrar_contacto (o indícale el WhatsApp si prefiere escribir directo).",
    ].join("\n"),
    whatsapp: "56920505996",
    ownerNotifyEmail: "servicios@premiumdental.cl",
    model: "gemini-3.5-flash-lite", // solo conversa + deriva, sin tools de agenda/tienda
    useEmojis: true,
    teaserMessage: "🦷 ¿Dudas sobre tu tratamiento? ¡Escríbeme!",
    // Colores e imágenes sacados en vivo de premiumdental.cl (computed styles
    // + zoom sobre los botones reales) el 2026-09-01: morado del botón
    // "Contáctanos" del header, verde-salvia del botón "Contáctanos" del
    // hero, logo y banner tal cual los sirve su propio sitio (WordPress).
    demoBranding: {
      primaryColor: "#6A4790",
      accentColor: "#6BAF90",
      logoUrl: "https://premiumdental.cl/wp-content/uploads/2024/08/cropped-ryf-1000-x-170-px-600-x-170-px-10-171x62.webp",
      heroImageUrl: "https://premiumdental.cl/wp-content/uploads/2024/08/dentistas-banner-inicio-dentalpremium.webp",
    },
  },
  // Datos tomados de boutiquedentalmontemar.cl el 2026-08-31 — prospecto,
  // sitio aún no instalado. Reservan por Dentalink (link real "Agenda cita
  // online" del sitio apunta a softwaredentalink.com): este asistente NO
  // agenda directo (sin tool de agenda), responde con la info real y deriva
  // al botón de agenda online o a WhatsApp. Sin precios publicados (clínica
  // "boutique", cotiza caso a caso) — no inventarlos.
  "boutique-dental-montemar": {
    id: "boutique-dental-montemar",
    businessName: "Boutique Dental Montemar",
    rubro: "clínica dental boutique",
    description:
      "Boutique Dental Montemar — la primera boutique dental de la Región de Valparaíso, en Concón/Viña del Mar. Salud bucal y estética integradas, en un espacio pensado para que la visita al dentista sea una experiencia cómoda.",
    facts: [
      "Áreas de atención: Rehabilitación oral e Implantología; Estética facial (rinomodelación, toxina botulínica, perfilado/aumento de labios, rejuvenecimiento facial, armonización orofacial); Tratamientos dentales (ortodoncia, cirugía bucal, endodoncia, odontología general, periodoncia).",
      "Sin precios publicados — es una clínica boutique que cotiza cada tratamiento según el caso; nunca inventes un precio, indica que se evalúa en la primera consulta.",
      "Horario: lunes a viernes de 09:00 a 19:00, sábados de 09:00 a 14:00.",
      "Ubicación: Av. Bosques de Montemar 30, Edificio Soho Montemar, Oficina 315 (Concón/Viña del Mar). Estacionamientos privados para pacientes.",
      "Contacto: WhatsApp +56 9 6487 6300, teléfono +56 32 380 5357, email info@boutiquedentalmontemar.cl, Instagram @boutiquedentalmontemar.",
      "Las reservas se hacen en su agenda online (Dentalink) o por WhatsApp — este chat NO agenda directo: si alguien quiere hora, indícale que use el botón \"Agenda cita online\" del sitio o escriba por WhatsApp, y usa registrar_contacto si prefiere que el equipo lo contacte.",
    ].join("\n"),
    whatsapp: "56964876300",
    ownerNotifyEmail: "info@boutiquedentalmontemar.cl",
    model: "gemini-3.5-flash-lite", // solo conversa + deriva, sin tools de agenda/tienda
    useEmojis: true,
  },
  // Datos tomados de odontoplus.cl (incl. su tienda online, con precios
  // reales publicados) el 2026-08-31 — prospecto, sitio aún no instalado.
  // Sin tool de agenda: "Agendar" y "Urgencia Dental" del sitio real ya
  // apuntan directo a WhatsApp (no tienen sistema de reservas propio), así
  // que el asistente solo responde con el catálogo real y deriva a WhatsApp.
  // Horario de atención NO está publicado en el sitio: no inventarlo.
  "odontoplus": {
    id: "odontoplus",
    businessName: "OdontoPlus",
    rubro: "clínica dental y estética",
    description:
      "OdontoPlus — clínica dental y estética con dos sucursales (Viña del Mar y Quilpué). Atiende implantes dentales, ortodoncia, odontología general y estética, además de estética facial y corporal.",
    facts: [
      "Áreas de atención: Implantes Dentales, Ortodoncia, Odontología General, Odontología Estética, Estética Facial, Estética Corporal, y Urgencia Dental.",
      "Precios reales publicados (CLP):",
      "- Limpieza dental — $35.000",
      "- Blanqueamiento Dental — $49.990",
      "- Carillas Dentales — $450.000",
      "- Cuota de Implante — $85.625",
      "- Cuota Implante Dental — $99.997",
      "- Pie de cirugía de implante — $390.000",
      "- Presupuesto cirugía de implante — $1.450.000",
      "- Criolipólisis 4 zonas — $119.990",
      "- Depilación Láser Cuerpo Completo — $380.000",
      "- Hifu 12D rostro completo + cuello + papada + bb glow — $119.990",
      "- Hifu 25D rostro completo + cuello + papada — $169.990",
      "- Hifu Papada — $49.990",
      "- Hilos Tensores — $430.000",
      "- Limpieza facial premium — $39.990",
      "- Limpieza facial premium + peeling — $45.000",
      "- Rinomodelación — $199.990",
      "- Sculptra — $419.990",
      "- Toxina 3 zonas — $169.990",
      "- Plasma rico en plaquetas 3 sesiones — $159.990",
      "Sucursales:",
      "- Viña del Mar: 10 Norte 746. WhatsApp +56 9 6836 3309.",
      "- Quilpué: Balmaceda 238, local 7. WhatsApp +56 9 8963 8008.",
      "El horario de atención NO está publicado — nunca lo inventes; si preguntan, indica que se confirma al agendar.",
      "El sitio no tiene sistema de reservas propio: 'Agendar' y 'Urgencia Dental' derivan directo a WhatsApp. Este chat tampoco agenda directo — si alguien quiere hora, junta nombre, teléfono, el tratamiento de interés y su sucursal preferida (Viña del Mar o Quilpué), y usa registrar_contacto o indícale el WhatsApp de esa sucursal.",
    ].join("\n"),
    whatsapp: "56968363309",
    model: "gemini-3.5-flash-lite", // solo conversa + deriva, sin tools de agenda/tienda
    useEmojis: true,
  },
  // Datos tomados de mapubarbershop.cl y @mapubarber el 2026-08-31 —
  // prospecto, sitio aún no instalado. Las reservas reales las procesa
  // Luar System (externo, botón "Reservar" del sitio): este asistente NO
  // agenda directo (no hay tool de agenda), solo responde con el catálogo
  // real y deriva a "Reservar" o a WhatsApp para agendar.
  "mapu-barber-shop": {
    id: "mapu-barber-shop",
    businessName: "Mapu Barber Shop",
    rubro: "barbería",
    description:
      "Mapu Barber Shop — barbería premium fundada en 2017 en Valparaíso, con dos sucursales en la región (Valparaíso y Viña del Mar).",
    facts: [
      "Servicios y precios (CLP, IVA incluido):",
      "- Corte de Cabello (45 min): corte con máquina y tijera, lavado y styling — $18.600",
      "- Corte Precisión 100% Tijeras (1h) — $25.000",
      "- Cambio de Look (1h 15min): transformación completa con asesoría — $27.000",
      "- Corte y Mantención Cabello Largo (1h) — $24.000",
      "- Corte + Lavado Premium (45 min) — $22.000",
      "- Perfilado de Barba Simple (35 min) — $16.500",
      "- Perfilado de Barba con Navaja (45 min): protocolo clásico con paños calientes y fríos — $18.600",
      "- Rasurado Completo de Barba (45 min) — $22.000",
      "- Combo Corte + Perfilado Barba Simple (1h) — $28.000",
      "- Combo Corte + Perfilado Barba Navaja (1h 15min) — $30.000",
      "- Combo Corte + Rasurado Completo Barba (1h 15min) — $34.000",
      "- Combo Rasurado Completo + Perfilado Navaja (1h 15min) — $35.000",
      "- Combo Rasurado Completo + Perfilado Simple (1h) — $32.500",
      "Sucursales y horario (ambas Lunes a Sábado 10:00-20:00):",
      "- Viña del Mar: 1 Oriente 876. WhatsApp +56 9 3671 7496.",
      "- Valparaíso: Calle Blanco 974, Local 01. WhatsApp +56 9 4919 3694.",
      "Instagram: @mapubarber.",
      "Las reservas se hacen en la plataforma de reservas del sitio (botón \"Reservar\") o por WhatsApp de la sucursal — este chat NO agenda directo: si alguien quiere hora, indícale el botón \"Reservar\" del sitio o el WhatsApp de la sucursal que le quede más cerca, y usa registrar_contacto si prefiere que el equipo lo contacte.",
    ].join("\n"),
    whatsapp: "56936717496",
    model: "gemini-3.5-flash-lite", // solo conversa + deriva, sin tools de agenda/tienda
    useEmojis: true,
  },
  // Datos tomados de fuxiaginecologia.cl y @fuxiaginecologia (Instagram) el
  // 2026-08-30 — prospecto, sitio aún no instalado. Horarios y precios NO están
  // publicados en ninguna de las dos fuentes: no inventar, confirmar con el
  // negocio antes de ir a producción.
  "fuxia-ginecologia": {
    id: "fuxia-ginecologia",
    businessName: "Fuxia Ginecología",
    rubro: "clínica de ginecología estética y funcional",
    description:
      "Fuxia Ginecología — Incontinencia & Hormonas, dirigida por el Dr. Anzorena. Especialistas en salud femenina: incontinencia urinaria, terapia hormonal bioidéntica y procedimientos ginecológicos estéticos y funcionales.",
    facts: [
      "Servicios: tratamiento de incontinencia urinaria, terapia hormonal bioidéntica, láser CO2 vaginal (reafirmación vaginal), armonización vulvar, labioplastia genital, reemplazo hormonal, atención por telemedicina, y otros procedimientos ginecológicos estéticos.",
      "Acreditada y autorizada por el SEREMI de Salud en Viña del Mar.",
      "Ubicación: Av. Concón-Reñaca #4000, OF 1602, Concón, Chile. También atiende por telemedicina para quien no pueda ir presencial.",
      "Contacto: WhatsApp +56 9 9179 5569, email info.fuxia@gmail.com, Instagram @fuxiaginecologia.",
      "Horarios de atención y precios NO están publicados — nunca los inventes. Si preguntan, indica que se confirman al coordinar la hora.",
      "Las horas se agendan por Doctoralia/AgendaPro (fuera de este chat, no dentro): cuando alguien quiera agendar, junta nombre, teléfono, el servicio de interés y el día/horario que prefiere, y usa registrar_contacto — el equipo de la clínica confirma el cupo real en su agenda y le escribe para cerrarlo. Nunca digas que una hora quedó agendada — solo que se tomó su solicitud y la confirman a la brevedad.",
    ].join("\n"),
    whatsapp: "56991795569",
    ownerNotifyEmail: "info.fuxia@gmail.com",
    // flash (no lite): registrar_contacto debe ejecutarse de verdad cuando junte
    // los datos, no solo "confirmar" en texto sin llamar la tool (visto en vivo
    // con -lite en flujos de reserva) — clínica real, no vale arriesgarlo.
    model: "gemini-2.5-flash",
  },
  // Datos tomados de yukipet.cl el 2026-09-01 — prospecto, sitio aún no
  // instalado. Prototipo del "concierge de tienda" (lib/embed-shopify.ts):
  // busca en el catálogo Shopify EN VIVO y agrega al carrito real de la
  // visita — sin token, endpoints públicos de Shopify. Verificado contra la
  // tienda real (búsqueda y ficha de producto); el agregado al carrito solo
  // funciona de verdad una vez instalado en yukipet.cl (same-origin).
  yukipet: {
    id: "yukipet",
    businessName: "Yuki Pet",
    rubro: "tienda online de productos para perros (caja de suscripción mensual)",
    description:
      "Yuki Pet — Yuki Box, una caja mensual temática para perros con juguetes y snacks premium personalizados. Más de 3.500 cajas enviadas en Chile. También vende juguetes, snacks y merchandising por separado.",
    facts: [
      "Yuki Box: suscripción mensual desde $19.990/mes, se cancela cuando quieras. Caja temática distinta cada mes (no se repite), con juguetes y snacks premium.",
      "También se venden juguetes, snacks y dijes coleccionables por separado — usa buscar_productos para catálogo y precios reales, nunca los inventes.",
      "Envío gratis a todo Chile (Blue Express).",
      "Instagram y TikTok: @yukipet.cl.",
      "Para dudas de una suscripción ya activa (cambiar dirección, pausar, cancelar), deriva a WhatsApp: el chat no gestiona suscripciones existentes.",
    ].join("\n"),
    whatsapp: "56987231647",
    model: "gemini-2.5-flash", // necesita llamar tools de verdad (buscar_productos/agregar_al_carrito), no solo conversar
    useEmojis: true,
    shopify: { domain: "yukipet.cl" },
    teaserMessage: "🐶 ¿Buscas algo para tu perrito? ¡Pregúntame!",
    // Branding sacado en vivo de yukipet.cl (computed styles) el 2026-09-01:
    // azul y rojo de los botones del hero, fondo crema del sitio, logo y una
    // foto real de una Yuki Box (evergreen, no depende de una campaña puntual).
    demoBranding: {
      primaryColor: "#0B4EDB",
      accentColor: "#DE1515",
      logoUrl: "https://yukipet.cl/cdn/shop/files/Yuki_Pet__N.png",
      heroImageUrl: "https://yukipet.cl/cdn/shop/files/TEMATICA_CARRUSEL_LANDING_4.png",
    },
  },
  // Datos tomados de auramay.cl el 2026-09-01 — prospecto, sitio aún no
  // instalado. Mismo prototipo de concierge de tienda que yukipet, tono más
  // sobrio (dermocosmética premium, sin emojis) acorde a la marca real.
  auramay: {
    id: "auramay",
    businessName: "Aura May",
    rubro: "dermocosmética natural para piel sensible",
    description:
      "Aura May — dermocosmética chilena para pieles sensibles, con ingredientes naturales (ácido hialurónico, aloe vera, jojoba, rosa mosqueta). Productos veganos, cruelty-free y testados dermatológicamente.",
    facts: [
      "Línea de productos: agua micelar (Laguz), crema de día (Uruz), crema/mascarilla de noche (Perth), aceite facial (Fehu), y rutinas en pack — usa buscar_productos para catálogo, precios y stock reales, nunca los inventes.",
      "Envío gratis sobre $29.990. Entrega 24-48h en Santiago, 2-4 días hábiles en regiones.",
      "Ofrecen asesoría gratuita con cosmetóloga: si alguien quiere recomendación personalizada según su tipo de piel, junta su nombre, teléfono y qué le pasa a su piel, y usa registrar_contacto.",
      "Instagram: @auramay.cl.",
    ].join("\n"),
    model: "gemini-2.5-flash",
    useEmojis: false,
    shopify: { domain: "auramay.cl" },
    teaserMessage: "✨ ¿Dudas sobre tu rutina de piel? Pregúntame",
    // Branding sacado en vivo de auramay.cl (computed styles) el 2026-09-01:
    // negro real del botón "Comprar rutina" (sin accentColor — el otro color
    // de marca es un amarillo muy pálido, mal contraste para el ícono blanco
    // del botón del widget), logo, y una foto evergreen del "Pack Quatro" (NO
    // el banner de la campaña "BlackAura" del home, que vence el 2026-09-02).
    demoBranding: {
      primaryColor: "#1B1917",
      logoUrl: "https://auramay.cl/cdn/shop/files/AURAmay_LOGO.png",
      heroImageUrl: "https://auramay.cl/cdn/shop/files/ChatGPT_Image_6_ago_2026_03_30_52_p.m..png",
    },
  },
  // Tenant de demostración (Nails Color — design partner del MVP del add-on).
  // Datos placeholder: reemplazar por precios/horarios reales antes de usar en frío.
  demo: {
    id: "demo",
    businessName: "Nails Color",
    rubro: "salón de uñas y pestañas",
    description:
      "Salón de manicure, pedicure y pestañas en Villa Alemana. Atiende con reserva; se puede dejar una seña para asegurar la hora.",
    facts: [
      "Servicios: manicure tradicional, esmaltado permanente, kapping, soft gel, pedicure spa, lifting y extensiones de pestañas.",
      "Horario referencial: martes a sábado de 10:00 a 19:00 (placeholder — confirmar).",
      "Las reservas se aseguran con una seña; el resto se paga en el salón (placeholder).",
      "Ubicación: Villa Alemana (Pje. Brasilia 150).",
    ].join("\n"),
    whatsapp: "56900000000",
    model: "gemini-2.5-flash",
    useEmojis: true,
    agenda: {
      services: [
        "Manicure tradicional",
        "Esmaltado permanente",
        "Kapping",
        "Soft gel",
        "Pedicure spa",
        "Lifting de pestañas",
        "Extensiones de pestañas",
      ],
      hours: [
        { day: "Martes a sábado", open: "10:00", close: "19:00" },
        { day: "Domingo", closed: true },
        { day: "Lunes", closed: true },
      ],
      slotMinutes: 60,
      daysAhead: 14,
    },
    store: {
      products: [
        { slug: "gift-card-20000", name: "Gift Card $20.000", price: 20000, category: "Gift cards", description: "Tarjeta de regalo canjeable por servicios." },
        { slug: "kit-cuidado-unas", name: "Kit de cuidado de uñas en casa", price: 14990, category: "Productos", description: "Aceite de cutícula, lima y crema de manos." },
        { slug: "esmalte-premium", name: "Esmalte premium (unidad)", price: 6990, category: "Productos", description: "Esmalte de larga duración." },
      ],
      shippingNote: "Retiro en el salón (Villa Alemana) o despacho a coordinar por WhatsApp.",
    },
  },
};

export function getEmbedTenant(id: string | null | undefined): EmbedTenant | null {
  if (!id) return null;
  return TENANTS[id] ?? null;
}

export function buildEmbedSystemPrompt(t: EmbedTenant): string {
  return [
    `Eres el asistente virtual de "${t.businessName}" (${t.rubro}).`,
    t.description,
    `Información del negocio (respondé SOLO con esto; no inventes precios, horarios ni servicios que no estén aquí):`,
    t.facts,
    t.agenda || t.externalAgenda
      ? `TÚ PUEDES AGENDAR DIRECTAMENTE en esta conversación usando tus herramientas. Hoy es ${new Intl.DateTimeFormat(
          "es-CL",
          { timeZone: "America/Santiago", weekday: "long", year: "numeric", month: "long", day: "numeric" }
        ).format(new Date())} (${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(
          new Date()
        )}); resuelve tú las fechas relativas ("el próximo martes") a formato YYYY-MM-DD sin pedírselas al cliente. Flujo: 1) pregunta qué servicio quiere; 2) usa consultar_disponibilidad para ofrecer 2-3 horarios REALES (nunca inventes horarios); 3) pide nombre y teléfono; 4) en cuanto tengas servicio, fecha, hora, nombre y teléfono, llama de inmediato a crear_reserva —no pidas confirmaciones extra ni preguntes si ya consultó disponibilidad, el servidor valida la hora—. Si crear_reserva devuelve error, ofrece otro horario. NUNCA digas que una hora quedó reservada sin que crear_reserva haya respondido ok.${
          t.agenda ? ` Servicios reservables: ${t.agenda.services.join(", ")}.` : ""
        }`
      : ``,
    t.store && t.store.products.some((p) => p.available !== false)
      ? `El negocio tiene TIENDA y puedes armar el pedido en la conversación. Productos (menciona precio, recomienda según lo que busque):\n${t.store.products
          .filter((p) => p.available !== false)
          .map((p) => `- ${p.name} [slug: ${p.slug}]: $${p.price.toLocaleString("es-CL")}${p.category ? ` (${p.category})` : ""}${p.description ? ` — ${p.description}` : ""}`)
          .join("\n")}\nCuando el cliente elija productos y cantidades y te dé nombre y teléfono, llama a crear_pedido —te devuelve el total REAL y un link de pago Webpay que debes entregarle tal cual. Nunca calcules el total tú ni inventes productos: solo slugs del catálogo. Si crear_pedido devuelve error, corrígelo con el cliente.`
      : ``,
    t.shopify
      ? `Eres además el CONCIERGE de la tienda. Si preguntan en general qué venden o qué líneas de productos tienen (sin pedir un producto puntual), responde directo con las líneas que ya están en la información del negocio de arriba — NO llames ninguna tool para eso, así respondes al instante; ahí mismo ofrece buscar el precio o stock exacto de la que le interese. Solo cuando busquen o pidan un producto puntual (un tipo, una necesidad concreta, o quieran el precio/stock real antes de recomendar o agregar algo), usa buscar_productos UNA vez con esa consulta puntual (catálogo en vivo, nunca inventes productos, precios ni stock) — no la llames varias veces seguidas para armar tú un listado completo. Cuando recomiendes uno y la persona quiera agregarlo, usa agregar_al_carrito con el handle exacto que te devolvió buscar_productos — la respuesta trae un botón que debes incluir TAL CUAL, en su propia línea, en tu mensaje (no lo reescribas ni lo describas, el widget lo convierte en un botón real de "agregar al carrito"). Si el producto tiene más de una variante (talla, color), pregunta cuál antes de agregar.`
      : ``,
    `Cuando la persona quiera cotizar o que la contacten (y no sea reserva de agenda ni compra de tienda): pídele su nombre y su teléfono (y email si lo tiene), y en cuanto te los dé, usa la tool registrar_contacto para avisar al negocio. Nunca inventes esos datos; úsalos tal como los entregó.`,
    t.whatsapp
      ? `Si no sabes algo, o si la persona prefiere hablar con una persona ahora, indícale amablemente que escriba por WhatsApp al +${t.whatsapp}.`
      : `Si no sabes algo, indícalo con honestidad y ofrece tomar sus datos con registrar_contacto para que le respondan.`,
    "Formato de tus respuestas: si enumeras varios servicios o precios usa viñetas ('- '), y destaca precios o nombres de servicios con **negrita** — el widget los muestra ya formateados. No uses encabezados (#), tablas ni bloques de código: no se ven bien en el widget.",
    t.useEmojis
      ? "Puedes usar 1-2 emojis por respuesta cuando aporten calidez (ej. 😊 ✨ 📅), sin exagerar ni ponerlos en cada frase."
      : "No uses emojis en tus respuestas.",
    "Responde siempre en español, breve, cálido y profesional. Máximo 2-3 frases por respuesta y cierra con una pregunta o el siguiente paso. Nunca inventes información que no esté arriba.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
