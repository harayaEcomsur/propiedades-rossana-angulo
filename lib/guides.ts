// Guías para compradores y propietarios (/guias). Cada dato legal o tributario
// lleva su fuente oficial; lo demás es la forma de trabajar de la oficina
// (servicios del config). Al cambiar una guía, actualizar `updated`.

export interface Guide {
  slug: string;
  title: string;
  description: string;
  updated: string; // AAAA-MM-DD
  intro: string;
  sections: Array<{ heading: string; paragraphs?: string[]; list?: string[] }>;
  sources: Array<{ label: string; url: string }>;
}

export const GUIDES: Guide[] = [
  {
    slug: "gastos-al-comprar-una-propiedad",
    title: "Gastos al comprar una propiedad en Chile: qué pagar además del precio",
    description:
      "Tasación, estudio de títulos, notaría, Conservador de Bienes Raíces, impuesto de timbres y seguros: los gastos de una compra con crédito hipotecario y cómo prepararse.",
    updated: "2026-10-10",
    intro:
      "Al comprar una casa o un departamento, el precio de venta no es lo único que se paga. Si la compra es con crédito hipotecario, el banco cobra los llamados gastos operacionales, y además hay que considerar los seguros que se pagan junto al dividendo. Conviene tenerlos presupuestados desde el primer día, junto con el pie.",
    sections: [
      {
        heading: "¿Qué son los gastos operacionales?",
        paragraphs: [
          "Son los costos legales y administrativos para formalizar la compra y el crédito. Según la Comisión para el Mercado Financiero (CMF), los paga el deudor e incluyen:",
        ],
        list: [
          "Tasación de la propiedad, que encarga el banco para fijar su valor de garantía.",
          "Estudio de títulos y redacción de la escritura, que revisan que la propiedad pueda venderse sin problemas legales.",
          "Gastos notariales de la escritura de compraventa y mutuo hipotecario.",
          "Impuesto de timbres y estampillas, que grava el crédito.",
          "Derechos de inscripción en el Conservador de Bienes Raíces, donde la propiedad queda a nombre del comprador.",
        ],
      },
      {
        heading: "Impuesto de timbres y estampillas: hasta 0,8% del crédito",
        paragraphs: [
          "La Ley de Timbres y Estampillas (DL 3.475) grava las operaciones de crédito de dinero con una tasa de 0,066% por cada mes o fracción entre la emisión y el vencimiento, con un máximo de 0,8%. En un crédito hipotecario, que dura años, se aplica ese tope. Se calcula sobre el monto del crédito, no sobre el precio de la propiedad: si compras con un pie mayor, pagas menos impuesto.",
        ],
      },
      {
        heading: "Seguros obligatorios",
        paragraphs: [
          "Los créditos hipotecarios exigen un seguro de desgravamen (cubre la deuda si fallece el deudor) y un seguro de incendio de la propiedad. La CMF indica que son obligatorios y que su prima se paga junto con el dividendo mensual, así que hay que sumarlos al calcular cuánto pagarás cada mes.",
        ],
      },
      {
        heading: "Cómo prepararse",
        list: [
          "Pide al banco la simulación con el costo total del crédito (CAE) y el detalle de gastos operacionales antes de firmar la promesa.",
          "Compara al menos tres bancos: la tasa de interés es el costo principal del crédito, y pequeñas diferencias pesan en 20 o 30 años.",
          "Reserva dinero para los gastos además del pie, y confirma con el banco cuáles puede financiar dentro del crédito.",
          "Antes de firmar la promesa, revisa que los títulos de la propiedad estén en orden.",
        ],
      },
      {
        heading: "Cómo te acompañamos",
        paragraphs: [
          "En la oficina coordinamos con abogados, banco y notaría durante la escritura, hasta que la propiedad queda inscrita a tu nombre. Si quieres saber cuánto vale realmente la propiedad que te interesa, un arquitecto del equipo hace la tasación con ventas comparables del sector.",
        ],
      },
    ],
    sources: [
      { label: "CMF Educa: ¿Cuánto cuesta un crédito hipotecario y en qué debe fijarse?", url: "https://www.cmfchile.cl/educa/621/w3-article-27374.html" },
      { label: "SII: Ley sobre Impuesto de Timbres y Estampillas (DL 3.475)", url: "https://www.sii.cl/normativa_legislacion/timbres.pdf" },
    ],
  },
  {
    slug: "arrendar-tu-propiedad-con-seguridad",
    title: "Cómo arrendar tu propiedad con seguridad: evaluación, contrato y entrega",
    description:
      "Qué revisar antes de arrendar tu casa o departamento en Viña del Mar o Concón: evaluación del arrendatario, contrato escrito, acta de entrega y qué cambió con la ley Devuélveme mi casa.",
    updated: "2026-10-10",
    intro:
      "Arrendar una propiedad es un buen negocio cuando se elige bien al arrendatario y todo queda por escrito. La mayoría de los problemas (atrasos, daños, discusiones por la garantía) se evitan con tres cosas: una buena evaluación, un contrato claro y un acta de entrega detallada.",
    sections: [
      {
        heading: "1. Evalúa al arrendatario antes de firmar",
        list: [
          "Pide liquidaciones de sueldo o documentos que acrediten ingresos estables.",
          "Revisa su informe comercial para ver deudas morosas.",
          "Si hay aval o codeudor, evalúalo con los mismos criterios.",
        ],
      },
      {
        heading: "2. Deja todo en un contrato escrito",
        paragraphs: [
          "El arriendo de inmuebles urbanos se rige por la Ley 18.101. Un contrato escrito evita discusiones y sirve de prueba si hay que cobrar. Debe indicar al menos:",
        ],
        list: [
          "Valor del arriendo, fecha de pago, forma de reajuste y quién paga gastos comunes y servicios.",
          "Monto de la garantía y en qué condiciones se devuelve.",
          "Duración del contrato y forma de darle término.",
          "Si se permiten mascotas, subarriendo o modificaciones.",
        ],
      },
      {
        heading: "3. Haz un acta de entrega con fotos",
        paragraphs: [
          "El acta de entrega registra el estado de la propiedad el día en que se entregan las llaves: pintura, artefactos, lecturas de medidores e inventario si se arrienda amoblada. Firmada por ambas partes y con fotos fechadas, es la base para decidir al final del contrato si corresponde descontar algo de la garantía.",
        ],
      },
      {
        heading: "4. Qué cambió con la ley Devuélveme mi casa",
        paragraphs: [
          "La Ley 21.461, vigente desde 2022, modificó la Ley 18.101 y creó un procedimiento monitorio para cobrar arriendos impagos. Tras la notificación, el arrendatario tiene 10 días para pagar la deuda u oponerse; si no lo hace, el tribunal lo condena al pago y ordena la restitución de la propiedad. La ley también permite pedir la restitución anticipada cuando el inmueble se está destruyendo o se vuelve inutilizable por culpa del arrendatario.",
          "Igual que antes, el mejor resguardo es evitar llegar a juicio: una evaluación seria del arrendatario y un contrato claro.",
        ],
      },
      {
        heading: "Cómo te acompañamos",
        paragraphs: [
          "Nos encargamos de la búsqueda y evaluación de arrendatarios con informe comercial, del contrato de arriendo y del acta de entrega. Para arriendos por temporada en el litoral, también administramos publicación, reservas, entrega y recepción.",
        ],
      },
    ],
    sources: [
      { label: "BCN Ley Chile: Ley 18.101, arrendamiento de predios urbanos", url: "https://www.bcn.cl/leychile/navegar?idLey=18101" },
      { label: "BCN Ley Chile: Ley 21.461 (Devuélveme mi casa)", url: "https://www.bcn.cl/leychile/navegar?idLey=21461" },
      { label: "BioBioChile: así funciona la ley Devuélveme mi casa", url: "https://www.biobiochile.cl/noticias/servicios/explicado/2024/05/25/asi-funciona-la-ley-devuelveme-mi-casa-exige-a-arrendatarios-a-desalojar-arriendos-por-deudas-impagas.shtml" },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
