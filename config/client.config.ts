import { defineClientConfig } from "@/config/schema";

// Demo para Propiedades Rossanna Angulo. Los datos de contacto, comisiones y
// trayectoria son placeholders razonables del rubro — reemplazar con los datos
// reales de la clienta antes de pasar a producción.
export const clientConfig = defineClientConfig({
  meta: {
    slug: "propiedades-rossana-angulo",
    businessName: "Propiedades Rossanna Angulo",
    rubro: "Gestión inmobiliaria, corretaje y administración",
    locale: "es-CL",
  },

  branding: {
    // Logo real de la clienta; paleta extraída con `npm run palette` (rojo del
    // logo, validado WCAG) y curada a mano (negro del logo como acento).
    logoUrl: "/clients/propiedades-rossana-angulo/logo.jpg",
    faviconUrl: "/clients/propiedades-rossana-angulo/logo.jpg",
    palette: {
      primary: "#DD3333",
      accent: "#1F1F1F",
      background: "#FBF9F9",
      foreground: "#261717",
    },
    fontPairing: "elegante",
    // El logo trae el nombre escrito en cursiva — no repetirlo en texto.
    logoIncludesName: true,
    layout: "inmobiliaria",
  },

  themeVariants: [
    {
      id: "a",
      name: "Fiel al logo",
      palette: { primary: "#DD3333", accent: "#1F1F1F", background: "#FBF9F9", foreground: "#261717" },
    },
    {
      id: "b",
      name: "Negro elegante",
      palette: { primary: "#1F1F1F", accent: "#DD3333", background: "#FBFAF9", foreground: "#261717" },
    },
    {
      id: "c",
      name: "Modo oscuro",
      palette: { primary: "#C52121", accent: "#EEEEDD", background: "#211212", foreground: "#F4F2EF" },
    },
  ],

  hero: {
    title: "Tu próxima propiedad, con asesoría de verdad",
    subtitle:
      "Corredora con base en Viña del Mar, especialista en la V Región, con operación en Santiago, el sur y todo Chile. Acompañamiento personal desde la tasación hasta la entrega de llaves.",
    ctaLabel: "Agenda una visita",
    ctaHref: "#contacto",
    backgroundImageUrl: "/clients/propiedades-rossana-angulo/hero.jpg",
  },

  services: [
    {
      icon: "Home",
      title: "Venta de propiedades",
      description: "Publicación en los principales portales, difusión activa y gestión de visitas hasta el cierre del negocio.",
    },
    {
      icon: "KeyRound",
      title: "Arriendo",
      description: "Búsqueda y evaluación de arrendatarios con informe comercial, contrato de arriendo y acta de entrega.",
    },
    {
      icon: "CalendarDays",
      title: "Arriendos temporales",
      description: "Administración de propiedades para arriendo por temporada en el litoral: publicación, reservas, entrega y recepción.",
    },
    {
      icon: "TrendingUp",
      title: "Tasación y estudio de mercado",
      description: "Valorización realista de tu propiedad según ventas comparables y el mercado actual de la comuna.",
    },
    {
      icon: "FileCheck",
      title: "Estudio de títulos y escrituración",
      description: "Coordinación con abogados, banco y notaría para que el cierre sea sin sorpresas.",
    },
    {
      icon: "Camera",
      title: "Marketing inmobiliario",
      description: "Fotografía profesional, ficha destacada y difusión en portales y redes para vender más rápido.",
    },
    {
      icon: "Users",
      title: "Asesoría a compradores",
      description: "Te acompaño a las visitas, reviso la documentación y negocio el mejor precio por ti.",
    },
  ],

  about: {
    title: "Quién te asesora",
    body: "Rossanna Angulo es corredora de propiedades con base en Viña del Mar y años de experiencia en la V Región, con operación en Santiago, el sur y todo Chile. Su sello es el acompañamiento personal en cada etapa del proceso — tasación, publicación, visitas, negociación y firma — con comunicación clara, sin letra chica y siempre con contrato por escrito.",
    imageUrl: "/clients/propiedades-rossana-angulo/nosotros.jpg",
  },

  gallery: [
    { url: "/clients/propiedades-rossana-angulo/galeria-1.jpg", alt: "Casa en venta con antejardín" },
    { url: "/clients/propiedades-rossana-angulo/galeria-2.jpg", alt: "Living comedor de casa moderna" },
    { url: "/clients/propiedades-rossana-angulo/galeria-3.jpg", alt: "Departamento amoblado en arriendo" },
    { url: "/clients/propiedades-rossana-angulo/galeria-4.jpg", alt: "Fachada de casas mediterráneas" },
  ],

  contact: {
    phone: "+56 9 8765 4321",
    whatsapp: "56987654321",
    whatsappPrefilledMessage: "Hola Rossanna! Vi tu sitio web y quiero consultar por una propiedad",
    email: "contacto@propiedadesrossanaangulo.cl",
    address: "Viña del Mar, Región de Valparaíso",
    mapQuery: "Viña del Mar, Chile",
    hours: [
      { day: "Lunes a viernes", open: "09:30", close: "19:00" },
      { day: "Sábado", open: "10:00", close: "14:00" },
      { day: "Domingo", closed: true },
    ],
    socials: [
      { platform: "instagram", url: "https://instagram.com/propiedadesrossanna" },
    ],
  },

  modules: {
    contactForm: true,
    whatsappButton: true,
    testimonials: true,
    faq: true,
    pricing: true,
    chat: true,
    propiedades: true,
    // Panel /inmobiliaria/admin para Rossanna y sus corredoras (ver
    // README/starter-kit → Plan Inmobiliaria). Requiere REALESTATE_ADMIN_KEY
    // (y opcionalmente NEXT_PUBLIC_GOOGLE_CLIENT_ID/SESSION_SECRET) para
    // entrar — ver .env.example. Sin esas env vars el módulo sigue existiendo
    // pero nadie puede entrar, así que no rompe nada activarlo antes de
    // configurarlas.
    inmobiliariaAdmin: true,
  },

  // Sindicación visible en la demo (la integración real se activa al contratar,
  // con las cuentas de la clienta).
  syndication: {
    portalinmobiliario: true,
    instagram: true,
  },

  // Inventario DEMO — propiedades y precios ficticios pero plausibles, reflejando
  // su cobertura real: base V Región + Santiago + sur. Reemplazar por inventario real.
  properties: [
    {
      slug: "depto-temporada-vina",
      title: "Departamento de temporada frente al mar",
      operation: "arriendo_temporada",
      type: "departamento",
      comuna: "Viña del Mar",
      price: "desde $85.000/noche",
      bedrooms: 2,
      bathrooms: 1,
      area: 60,
      description: "Departamento equipado para 4 personas a pasos de la playa. Administración completa de temporada: publicación, reservas, entrega y recepción — el dueño solo recibe su rendición.",
      images: ["/clients/propiedades-rossana-angulo/galeria-3.jpg", "/clients/propiedades-rossana-angulo/galeria-2.jpg"],
      featured: true,
    },
    {
      slug: "casa-vina-alto",
      title: "Casa familiar en Viña Alto",
      operation: "venta",
      type: "casa",
      comuna: "Viña del Mar",
      price: "UF 7.400",
      bedrooms: 4,
      bathrooms: 3,
      area: 160,
      parking: 2,
      description: "Casa amplia con antejardín y quincho en barrio residencial consolidado. Living comedor luminoso, cocina amoblada y dormitorio principal en suite.",
      images: ["/clients/propiedades-rossana-angulo/galeria-1.jpg", "/clients/propiedades-rossana-angulo/hero.jpg"],
      featured: true,
    },
    {
      slug: "depto-nunoa-santiago",
      title: "Departamento moderno en Ñuñoa",
      operation: "venta",
      type: "departamento",
      comuna: "Ñuñoa, Santiago",
      price: "UF 4.900",
      bedrooms: 2,
      bathrooms: 2,
      area: 72,
      parking: 1,
      description: "Departamento moderno cerca de Plaza Ñuñoa y metro: terminaciones de primera, logia y bodega. Ideal primera vivienda o inversión para arriendo.",
      images: ["/clients/propiedades-rossana-angulo/galeria-2.jpg", "/clients/propiedades-rossana-angulo/galeria-3.jpg"],
      featured: true,
    },
    {
      slug: "casa-puerto-varas",
      title: "Casa con vista al lago en Puerto Varas",
      operation: "venta",
      type: "casa",
      comuna: "Puerto Varas",
      price: "UF 9.800",
      bedrooms: 4,
      bathrooms: 3,
      area: 200,
      parking: 2,
      description: "Casa de descanso con vista al lago Llanquihue: gestión completa a distancia — tasación, publicación, visitas coordinadas en terreno y cierre en notaría, sin que el dueño viaje.",
      images: ["/clients/propiedades-rossana-angulo/galeria-4.jpg", "/clients/propiedades-rossana-angulo/galeria-1.jpg"],
    },
    {
      slug: "depto-arriendo-vina-centro",
      title: "Departamento en arriendo anual, Viña Centro",
      operation: "arriendo",
      type: "departamento",
      comuna: "Viña del Mar",
      price: "$520.000/mes",
      bedrooms: 2,
      bathrooms: 1,
      area: 58,
      description: "A cuadras de la Plaza de Viña, con locomoción y comercio en la puerta. Arrendatario evaluado con informe comercial y contrato al día.",
      images: ["/clients/propiedades-rossana-angulo/galeria-3.jpg", "/clients/propiedades-rossana-angulo/galeria-2.jpg"],
    },
    {
      slug: "parcela-quillota",
      title: "Parcela con casa en Quillota",
      operation: "venta",
      type: "parcela",
      comuna: "Quillota",
      price: "UF 6.200",
      bedrooms: 3,
      bathrooms: 2,
      area: 5000,
      description: "Parcela de 5.000 m² con casa habitable, árboles frutales y agua de pozo. A 20 minutos de la ruta a la costa — teletrabajo con vida de campo.",
      images: ["/clients/propiedades-rossana-angulo/galeria-4.jpg", "/clients/propiedades-rossana-angulo/hero.jpg"],
    },
  ],

  testimonials: [
    { name: "Familia Contreras", quote: "Rossanna vendió nuestro departamento en cinco semanas y nos acompañó hasta la firma en notaría.", rating: 5 },
    { name: "Jorge M.", quote: "Me consiguió arrendatario en una semana, con informe comercial y contrato claro. Cero problemas desde entonces.", rating: 5 },
    { name: "Carolina R.", quote: "Como compradora primeriza, me explicó cada paso del crédito y la escritura. Se agradece la paciencia.", rating: 5 },
  ],

  faq: [
    { q: "¿Cuánto cobra por vender mi propiedad?", a: "La comisión de venta es el 2% + IVA del valor de la propiedad, y se paga solo si el negocio se concreta. Incluye tasación, publicación, visitas y acompañamiento hasta la firma." },
    { q: "¿Y por arrendar?", a: "El equivalente al 50% + IVA del primer mes de arriendo, que incluye evaluación del arrendatario con informe comercial y contrato de arriendo." },
    { q: "¿Cuánto demora venderse una propiedad?", a: "Depende del sector y del precio, pero una propiedad bien tasada y con buenas fotos se vende en general entre 2 y 4 meses." },
    { q: "¿Qué documentos necesito para vender?", a: "Escritura, certificado de dominio vigente, certificado de hipotecas y gravámenes, y contribuciones al día. Te ayudo a reunirlos todos." },
    { q: "¿Trabajas con compradores con crédito hipotecario?", a: "Sí, la mayoría de las ventas son con crédito. Coordino directamente con el banco y la notaría los plazos de la operación." },
    { q: "¿En qué zonas trabajas?", a: "Mi base es Viña del Mar y la mayoría de mis propiedades están en la V Región, pero opero también en Santiago, el sur y todo Chile: la gestión y publicación es remota y las visitas se coordinan según la zona." },
    { q: "¿Administras arriendos por temporada?", a: "Sí — administro propiedades para arriendo temporal, especialmente departamentos de veraneo en el litoral: publicación, reservas, entrega y recepción. Las condiciones se acuerdan según cada propiedad." },
  ],

  pricing: [
    {
      name: "Venta",
      price: "2% + IVA",
      features: ["Tasación y estudio de mercado", "Fotografía y publicación en portales", "Gestión de visitas y negociación", "Acompañamiento hasta la firma"],
      highlighted: true,
    },
    {
      name: "Arriendo",
      price: "50% + IVA del primer mes",
      features: ["Evaluación con informe comercial", "Contrato de arriendo", "Acta de entrega de la propiedad"],
    },
    {
      name: "Solo tasación",
      price: "$60.000",
      features: ["Informe de valorización escrito", "Comparables del sector", "Se descuenta si luego vendes conmigo"],
    },
  ],

  chat: {
    businessDescription:
      "Propiedades Rossanna Angulo es una corredora de propiedades independiente con base en Viña del Mar, especialista en la V Región y con operación en Santiago, el sur y todo Chile. Ofrece venta, arriendo, arriendos temporales (administración de propiedades de temporada en el litoral), tasación, estudio de títulos, marketing inmobiliario y asesoría a compradores. Atiende con acompañamiento personal en todo el proceso.",
    qaPairs: [
      { q: "¿Cuánto cobra por vender una propiedad?", a: "2% + IVA del valor de venta, solo si el negocio se concreta. Incluye tasación, publicación, visitas y acompañamiento hasta la firma." },
      { q: "¿Cuánto cobra por arrendar?", a: "El 50% + IVA del primer mes de arriendo, con informe comercial del arrendatario y contrato incluido." },
      { q: "¿Hace tasaciones?", a: "Sí, la tasación con informe escrito cuesta $60.000 y se descuenta de la comisión si luego vendes con ella." },
      { q: "¿En qué zonas trabaja?", a: "Base en Viña del Mar y especialidad en la V Región; opera también en Santiago, el sur y todo Chile — la gestión es remota y las visitas se coordinan según la zona." },
      { q: "¿Administra arriendos por temporada?", a: "Sí, administra propiedades para arriendo temporal en el litoral (departamentos de veraneo): publicación, reservas, entrega y recepción. Las condiciones se conversan según cada propiedad." },
      { q: "¿Cuál es el horario de atención?", a: "Lunes a viernes de 9:30 a 19:00 y sábados de 10:00 a 14:00. Las visitas se coordinan según disponibilidad." },
      { q: "¿Cómo agendo una visita?", a: "Por WhatsApp o el formulario de contacto de esta página, indicando la propiedad o el tipo de propiedad que buscas." },
      { q: "¿Trabaja con crédito hipotecario?", a: "Sí, coordina directamente con el banco y la notaría los plazos de la operación." },
    ],
    fallbackToWhatsapp: true,
  },

  seo: {
    title: "Propiedades Rossanna Angulo — Corretaje de propiedades en Viña del Mar y todo Chile",
    description:
      "Venta, arriendo, arriendos temporales y tasación de propiedades. Base en Viña del Mar, especialista en la V Región, operación en todo Chile.",
    businessType: "RealEstateAgent",
    priceRange: "$$",
    keywords: ["corredora de propiedades viña del mar", "propiedades quinta región", "arriendos temporales viña del mar", "corredora de propiedades chile", "tasación de propiedades"],
  },
});
