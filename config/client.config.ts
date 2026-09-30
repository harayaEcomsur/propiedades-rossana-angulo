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
      "Corredora con base en Viña del Mar, especialista en Viña, Reñaca y Concón, con operación en Santiago y todo Chile. Acompañamiento personal desde la tasación hasta la entrega de llaves.",
    ctaLabel: "Agenda una visita",
    ctaHref: "#contacto",
    // Vista aérea de las dunas de Concón. Licencia CC BY 2.0: el crédito es
    // obligatorio (se muestra en la esquina del hero).
    backgroundImageUrl: "/clients/propiedades-rossana-angulo/hero-concon-dunas.jpg",
    backgroundImageCredit: {
      text: "Foto: Deensel · CC BY 2.0",
      href: "https://commons.wikimedia.org/wiki/File:Dunas_De_Conc%C3%B3n_(40046667682).jpg",
    },
    badges: ["Asesoría legal en cada operación"],
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
      description: "Valorización realista de tu propiedad, realizada por un arquitecto del equipo, según ventas comparables y el mercado actual de la comuna.",
    },
    {
      icon: "FileCheck",
      title: "Estudio de títulos y escrituración",
      description: "Asesoría legal y coordinación con abogados, banco y notaría durante la escritura, hasta la inscripción de la propiedad.",
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
    body: "Rossanna Angulo es asesora inmobiliaria acreditada, con 9 años de experiencia y base en Viña del Mar. Trabaja principalmente en Viña del Mar, Reñaca y Concón, y opera también en Santiago, el sur y todo Chile, junto a un equipo que incluye un arquitecto para las tasaciones. Su sello es el acompañamiento personal en cada etapa del proceso — publicación, visitas, negociación, escritura e inscripción — con comunicación clara, sin letra chica y siempre con contrato por escrito.",
    imageUrl: "/clients/propiedades-rossana-angulo/nosotros.jpg",
  },

  gallery: [
    { url: "/clients/propiedades-rossana-angulo/galeria-1.jpg", alt: "Casa en venta con antejardín" },
    { url: "/clients/propiedades-rossana-angulo/galeria-2.jpg", alt: "Living comedor de casa moderna" },
    { url: "/clients/propiedades-rossana-angulo/galeria-3.jpg", alt: "Departamento amoblado en arriendo" },
    { url: "/clients/propiedades-rossana-angulo/galeria-4.jpg", alt: "Fachada de casas mediterráneas" },
  ],

  contact: {
    phone: "+56 9 8207 9214",
    whatsapp: "56982079214",
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

  // Dónde se publica cada propiedad. Instagram tiene integración real (panel);
  // Portal Inmobiliario no está conectado, así que no se nombra: se menciona
  // genéricamente "otros portales" (FindHome, etc., los maneja la clienta).
  syndication: {
    instagram: true,
    otherPortals: true,
  },

  // Inventario inicial tomado de las publicaciones de @propiedadesrossanna
  // (septiembre 2026). Apenas se cargue la primera propiedad en el panel
  // /inmobiliaria/admin, el sitio pasa a mostrar las del panel (ver
  // lib/public-properties.ts) y esta lista queda solo como respaldo.
  properties: [
    {
      slug: "depto-meseta-coraceros",
      title: "Departamento piso 28 en Meseta Coraceros",
      operation: "venta",
      type: "departamento",
      comuna: "Viña del Mar",
      price: "UF 8.500",
      description: "Departamento en piso 28, en el bello entorno de Meseta Coraceros, Viña del Mar. Vista privilegiada y excelente conectividad, a pasos del mall, supermercados y centros médicos. Fue refaccionado: líneas modernas, ventanas termopanel y malla de seguridad en todas sus ventanas.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/depto-meseta-coraceros.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/Dd2V3F9M93G/",
      featured: true,
    },
    {
      slug: "depto-providencia-carlos-antunez",
      title: "Departamento en Carlos Antúnez, Providencia",
      operation: "venta",
      type: "departamento",
      comuna: "Providencia",
      price: "UF 4.990",
      bedrooms: 1,
      bathrooms: 1,
      parking: 1,
      description: "Departamento con muy buena ubicación en calle Carlos Antúnez, Providencia. 1 dormitorio, 1 baño, estar con cocina integrada y equipada. Incluye estacionamiento y bodega.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/depto-providencia-carlos-antunez.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/DdmfwrZB1K5/",
      featured: true,
    },
    {
      slug: "casa-bosque-de-montemar",
      title: "Casa en Bosque de Montemar",
      operation: "venta",
      type: "casa",
      comuna: "Concón",
      price: "UF 13.500",
      bedrooms: 5,
      bathrooms: 4,
      parking: 2,
      description: "Excelente casa en el exclusivo y residencial sector de Bosque de Montemar, con gran conectividad, excelente terreno y muy buena distribución. Recibe muy buena luz natural por su orientación poniente. 5 dormitorios, 4 baños, sala de estar y quincho cerrado con vista libre. Estacionamiento para 2 a 3 vehículos.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/casa-bosque-de-montemar.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/DdHCS0UB_SK/",
      featured: true,
    },
    {
      slug: "casa-condominio-piscina-quincho",
      title: "Casa en condominio con piscina y quincho",
      operation: "venta",
      type: "casa",
      comuna: "La Reina",
      price: "UF 12.850",
      bedrooms: 5,
      bathrooms: 4,
      area: 164,
      parking: 3,
      description: "Casa en condominio con piscina, quincho y acceso controlado. 5 dormitorios, 4 baños completos y estacionamiento para 3 vehículos. 265 m² de terreno y 164 m² construidos. Excelente conectividad a Av. Príncipe de Gales, Tobalaba y Echeñique, cercana a comercio y locomoción.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/casa-condominio-piscina-quincho.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/Dc8qhwrhKJp/",
      featured: true,
    },
    {
      slug: "depto-av-antofagasta",
      title: "Departamento en Av. Antofagasta, cerca de Clínica Reñaca",
      operation: "venta",
      type: "departamento",
      comuna: "Viña del Mar",
      price: "UF 4.050",
      area: 70,
      parking: 1,
      description: "Departamento de 70 m² en Av. Antofagasta, con excelente conectividad: a pasos del strip center con supermercado Unimarc, cercano a Clínica Reñaca y con locomoción en la puerta. Dormitorio principal con una hermosa vista. Estacionamiento y bodega. El edificio cuenta con piscina exterior, áreas verdes, lavandería, estacionamientos de visitas y acceso controlado.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/depto-av-antofagasta.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/DdWOizJhbmb/",
    },
    {
      slug: "depto-el-encanto-las-agatas",
      title: "Exclusivo departamento en El Encanto, Reñaca",
      operation: "arriendo",
      type: "departamento",
      comuna: "Viña del Mar",
      price: "$2.100.000/mes (GC incluido)",
      description: "Exclusivo departamento en el sector de El Encanto, en calle Las Ágatas, a pasos de Av. Edmundo Eluchans. Muy buena conectividad. Detalles en su construcción que le otorgan elegancia, y una vista privilegiada a toda la bahía.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/depto-el-encanto-las-agatas.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/DdH8C7pBm7i/",
      featured: true,
    },
    {
      slug: "depto-mariposa-concon",
      title: "Departamento mariposa piso 18 en Concón",
      operation: "arriendo",
      type: "departamento",
      comuna: "Concón",
      price: "$670.000/mes + $120.000 GC",
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      description: "Departamento mariposa en piso 18, calle Escrivá de Balaguer, Concón, con una maravillosa vista. Terraza amplia con malla de seguridad. 2 dormitorios, 2 baños, estacionamiento y bodega.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/depto-mariposa-piso-18.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/DdMDRI2BZ93/",
    },
    {
      slug: "loft-renaca",
      title: "Loft en condominio con piscina, Reñaca",
      operation: "arriendo",
      type: "departamento",
      comuna: "Viña del Mar",
      price: "$580.000/mes + $120.000 GC",
      bedrooms: 2,
      parking: 1,
      description: "Loft en condominio pequeño con piscina y excelente conectividad, a dos cuadras del McDonald's. Cada loft cuenta con su estacionamiento. El gasto común incluye el agua.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/loft-arriendo.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/DdkWW5HNDdH/",
    },
    {
      slug: "depto-rotonda-santa-julia",
      title: "Departamento en Rotonda Santa Julia",
      operation: "arriendo",
      type: "departamento",
      comuna: "Viña del Mar",
      price: "$460.000/mes (GC incluido)",
      bedrooms: 3,
      bathrooms: 1,
      parking: 1,
      description: "Departamento en condominio cerrado junto a Rotonda Santa Julia, con excelente conectividad y a pasos del centro comercial con Tottus y Homecenter. 3 dormitorios, 1 baño y estacionamiento en box cerrado.",
      images: ["/clients/propiedades-rossana-angulo/propiedades/depto-rotonda-santa-julia.jpg"],
      video: "https://www.instagram.com/propiedadesrossanna/reel/DdG0H1ehNG-/",
    },
  ],

  // Diferenciadores bajo el hero — todos confirmados por la clienta o por su
  // Instagram ("Acreditada / 9 años de experiencia").
  pillars: [
    { icon: "Award", title: "9 años de experiencia", text: "Asesora inmobiliaria acreditada en la Región de Valparaíso." },
    { icon: "Scale", title: "Asesoría legal", text: "Te acompañamos en la escritura y hasta la inscripción de la propiedad." },
    { icon: "Ruler", title: "Tasación por arquitecto", text: "Valorización con informe escrito y comparables del sector." },
    { icon: "MapPin", title: "Viña, Reñaca y Concón", text: "Conocemos cada sector, y operamos también en Santiago." },
  ],

  // Asesores (sección "Nuestros asesores"). Las fotos están por definirse:
  // mientras tanto cada una lleva un avatar ilustrado con sus iniciales.
  team: [
    {
      name: "Rossanna Angulo",
      role: "CEO · Asesora inmobiliaria",
      bio: "Asesora acreditada con 9 años de experiencia en Viña del Mar, Reñaca y Concón. Acompaña cada operación hasta la inscripción.",
      phone: "+56 9 8207 9214",
      whatsapp: "56982079214",
    },
    {
      name: "Carolina Llona",
      role: "Asesora inmobiliaria",
      phone: "+56 9 4939 2689",
      whatsapp: "56949392689",
      email: "caro@propiedadesrossannaangulo.cl",
    },
    {
      name: "María de los Ángeles Thauby",
      role: "Asesora inmobiliaria",
      phone: "+56 9 4217 2399",
      whatsapp: "56942172399",
      email: "mary@propiedadesrossannaangulo.cl",
    },
    {
      name: "Loreto Angulo",
      role: "Asesora inmobiliaria",
      phone: "+56 9 8479 3672",
      whatsapp: "56984793672",
      email: "loreto@propiedadesrossannaangulo.cl",
    },
  ],

  testimonials: [
    { name: "Familia Contreras", quote: "Rossanna vendió nuestro departamento en cinco semanas y nos acompañó hasta la firma en notaría.", rating: 5 },
    { name: "Jorge M.", quote: "Me consiguió arrendatario en una semana, con informe comercial y contrato claro. Cero problemas desde entonces.", rating: 5 },
    { name: "Carolina R.", quote: "Como compradora primeriza, me explicó cada paso del crédito y la escritura. Se agradece la paciencia.", rating: 5 },
  ],

  faq: [
    { q: "¿Cuánto cobra por vender mi propiedad?", a: "La comisión de venta es el 2% + IVA del valor de la propiedad, y se paga solo si el negocio se concreta. Incluye publicación, visitas, negociación y acompañamiento profesional con asesoría legal durante la escritura y hasta la inscripción de la propiedad. La tasación no está incluida: se cotiza aparte ($150.000)." },
    { q: "¿Cuánto cuesta una tasación?", a: "La tasación cuesta $150.000 y la realiza un arquitecto del equipo, con informe de valorización escrito y comparables del sector. Se cobra aparte de la comisión de venta." },
    { q: "¿Incluyen asesoría legal?", a: "Sí. En la venta te acompañamos con asesoría legal durante todo el proceso de escritura y hasta la inscripción de la propiedad a nombre del comprador." },
    { q: "¿Y por arrendar?", a: "El equivalente al 50% + IVA del primer mes de arriendo, que incluye evaluación del arrendatario con informe comercial y contrato de arriendo." },
    { q: "¿Cuánto demora venderse una propiedad?", a: "Una propiedad bien tasada y con buenas fotos se vende en general entre 2 y 4 meses, según el sector y el precio." },
    { q: "¿Qué documentos necesito para vender?", a: "Escritura, certificado de dominio vigente, certificado de hipotecas y gravámenes, y contribuciones al día. Te ayudo a reunirlos todos." },
    { q: "¿Trabajas con compradores con crédito hipotecario?", a: "Sí, la mayoría de las ventas son con crédito. Coordino directamente con el banco y la notaría los plazos de la operación." },
    { q: "¿En qué zonas trabajas?", a: "Mi base es Viña del Mar y la mayoría de mis propiedades están en la V Región (Viña del Mar, Reñaca y Concón). También opero en Santiago, el sur y todo Chile: la gestión y publicación es remota y las visitas se coordinan según la zona." },
    { q: "¿Administras arriendos por temporada?", a: "Sí — administro propiedades para arriendo temporal, especialmente departamentos de veraneo en el litoral: publicación, reservas, entrega y recepción. Las condiciones se acuerdan según cada propiedad." },
  ],

  pricing: [
    {
      name: "Venta",
      price: "2% + IVA",
      features: [
        "Fotografía y publicación en portales",
        "Gestión de visitas y negociación",
        "Acompañamiento profesional con asesoría legal en la escritura",
        "Hasta la inscripción de la propiedad",
      ],
      highlighted: true,
    },
    {
      name: "Arriendo",
      price: "50% + IVA del primer mes",
      features: ["Evaluación con informe comercial", "Contrato de arriendo", "Acta de entrega de la propiedad"],
    },
    {
      name: "Solo tasación",
      price: "$150.000",
      features: ["Realizada por un arquitecto del equipo", "Informe de valorización escrito", "Comparables del sector"],
    },
  ],

  chat: {
    businessDescription:
      "Propiedades Rossanna Angulo es una corredora de propiedades independiente con base en Viña del Mar, especialista en la V Región y con operación en Santiago, el sur y todo Chile. Ofrece venta, arriendo, arriendos temporales (administración de propiedades de temporada en el litoral), tasación, estudio de títulos, marketing inmobiliario y asesoría a compradores. Atiende con acompañamiento personal en todo el proceso.",
    qaPairs: [
      { q: "¿Cuánto cobra por vender una propiedad?", a: "2% + IVA del valor de venta, solo si el negocio se concreta. Incluye publicación, visitas, negociación y acompañamiento profesional con asesoría legal durante la escritura y hasta la inscripción de la propiedad. La tasación no está incluida en la comisión: se cobra aparte ($150.000)." },
      { q: "¿Cuánto cobra por arrendar?", a: "El 50% + IVA del primer mes de arriendo, con informe comercial del arrendatario y contrato incluido." },
      { q: "¿Hace tasaciones?", a: "Sí. La tasación la realiza un arquitecto del equipo, incluye informe de valorización escrito y cuesta $150.000." },
      { q: "¿En qué zonas trabaja?", a: "Base en Viña del Mar y especialidad en la V Región; opera también en Santiago, el sur y todo Chile — la gestión es remota y las visitas se coordinan según la zona." },
      { q: "¿Administra arriendos por temporada?", a: "Sí, administra propiedades para arriendo temporal en el litoral (departamentos de veraneo): publicación, reservas, entrega y recepción. Las condiciones se conversan según cada propiedad." },
      { q: "¿Cuál es el horario de atención?", a: "Lunes a viernes de 9:30 a 19:00 y sábados de 10:00 a 14:00. Las visitas se coordinan según disponibilidad." },
      { q: "¿Cómo agendo una visita?", a: "Por WhatsApp o el formulario de contacto de esta página, indicando la propiedad o el tipo de propiedad que buscas." },
      { q: "¿Trabaja con crédito hipotecario?", a: "Sí, coordina directamente con el banco y la notaría los plazos de la operación." },
    ],
    fallbackToWhatsapp: true,
  },

  seo: {
    // ~60 caracteres: lo que Google muestra sin cortar.
    title: "Corredora de propiedades en Viña del Mar y Concón | Rossanna Angulo",
    description:
      "Venta y arriendo de casas y departamentos en Viña del Mar, Reñaca, Concón y Santiago. Tasación por arquitecto y asesoría legal hasta la inscripción.",
    ogImageUrl: "/clients/propiedades-rossana-angulo/og.jpg",
    businessType: "RealEstateAgent",
    priceRange: "$$",
    keywords: [
      "corredora de propiedades viña del mar",
      "corredora de propiedades concón",
      "departamentos en venta reñaca",
      "arriendo departamento viña del mar",
      "casas en venta concón",
      "tasación de propiedades viña del mar",
    ],
    postalAddress: { addressLocality: "Viña del Mar", addressRegion: "Región de Valparaíso", addressCountry: "CL" },
    // Según el sitio y sus publicaciones: base en la V Región, operación en
    // Santiago y todo Chile.
    areaServed: ["Viña del Mar", "Reñaca", "Concón", "Región de Valparaíso", "Santiago", "Chile"],
    knowsAbout: [
      "Corretaje de propiedades",
      "Venta de propiedades",
      "Arriendo de propiedades",
      "Arriendos de temporada",
      "Tasación de propiedades",
      "Estudio de títulos",
      "Asesoría legal inmobiliaria",
    ],
    founder: "Rossanna Angulo",
    founderJobTitle: "Asesora inmobiliaria",
  },
});
