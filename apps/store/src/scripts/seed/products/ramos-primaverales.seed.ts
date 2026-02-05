import { CATEGORIES } from "@/shared/constants";

// Cache-busting para que se refresquen imágenes en navegador/CDN/next-image.
const BOUQUETS_SPRING_IMG_V = "20260205";
// Cache-busting específico para Blush Garden (cuando cambiás el archivo y querés forzar refresh).
const BLUSH_GARDEN_IMG_V = "20260205-2";

export const ramosPrimaverales = [
  {
    title: 'SOFT WHISPER (Susurro Suave)',
    description:
      '<p>La elegancia de lo sutil. Una combinación etérea donde el blanco puro del Lilium se encuentra con la suavidad de las rosas pastel. Ideal para decir “te quiero” con delicadeza o para iluminar un rincón con calma y sofisticación.</p><ul><li><strong>Composición estimada:</strong> 1 vara de lilium blanco (premium), 1 rosa importada (rosa pálido/nude), 2 varas de alstroemerias (blancas/crema), 2 varas de crisantemos/margaritas (rosa pastel).</li></ul>',
    images: [
      `/assets/img/productos/ramosprivaverales/ramoprimaveral2.jpeg?v=${BOUQUETS_SPRING_IMG_V}`,
    ],
    category: CATEGORIES["ramosPrimaverales"],
    price: {
      ars: {
        base: 65000,
        aument: 0,
      },
      usd: {
        base: 65,
        aument: 0,
      },
    },
  },
  {
    title: 'SUNSET GLOW (Resplandor)',
    description:
      '<p>La energía del atardecer en tus manos. Este diseño vibrante fusiona la calidez del naranja y el amarillo con toques profundos de violeta. Un ramo cargado de optimismo, perfecto para celebrar logros, cumpleaños o levantar el ánimo al instante.</p><ul><li><strong>Composición estimada:</strong> 2 varas de lilium naranja, 1 gerbera amarilla (grande), 2 varas de crisantemo “San Vicente” (violeta), 2 varas de alstroemerias (salmón/naranja).</li></ul>',
    images: [
      `/assets/img/productos/ramosprivaverales/ramoprimaveral3.jpeg?v=${BOUQUETS_SPRING_IMG_V}`,
    ],
    category: CATEGORIES["ramosPrimaverales"],
    price: {
      ars: {
        base: 85000,
        aument: 0,
      },
      usd: {
        base: 85,
        aument: 0,
      },
    },
  },
  {
    title: 'PINK MAJESTY (Majestad Rosa)',
    description:
      '<p>Volumen y fragancia. Un tributo a la flor más noble de la primavera: el Lilium. Este ramo impacta por su presencia y aroma, rodeado de texturas silvestres que realzan su color. Para quienes no buscan pasar desapercibidos.</p><ul><li><strong>Composición estimada:</strong> 2–3 varas de lilium “Stargazer” u oriental (rosa intenso), 3 varas de crisantemos/margaritas (mix blanco/rosa), 2 varas de alstroemerias (rosa).</li></ul>',
    images: [
      `/assets/img/productos/ramosprivaverales/pinky.png?v=${BOUQUETS_SPRING_IMG_V}`,
    ],
    category: CATEGORIES["ramosPrimaverales"],
    price: {
      ars: {
        base: 75000,
        aument: 0,
      },
      usd: {
        base: 75,
        aument: 0,
      },
    },
  },
  {
    title: 'TROPICAL VIBE',
    description:
      '<p>Una fiesta de color. Rompemos las reglas mezclando la pasión de la rosa roja con la alegría de la gerbera fucsia y notas cítricas de naranja. Un diseño audaz, texturado y lleno de vida. Es el regalo perfecto para personalidades fuertes y alegres.</p><ul><li><strong>Composición estimada:</strong> 1 rosa roja importada, 1 gerbera fucsia, 1 vara de gladiolo (salmón/naranja), 2 varas de rosas spray (mini rosas naranjas), 1 vara de statice (violeta) + alstroemerias naranjas.</li></ul>',
    images: [
      `/assets/img/productos/ramosprivaverales/vibe.jpeg?v=${BOUQUETS_SPRING_IMG_V}`,
    ],
    category: CATEGORIES["ramosPrimaverales"],
    price: {
      ars: {
        base: 65000,
        aument: 0,
      },
      usd: {
        base: 65,
        aument: 0,
      },
    },
  },
  {
    title: 'CLASSIC ROMANCE',
    description:
      '<p>El equilibrio perfecto entre lo clásico y lo moderno. La dulzura de la rosa se une a la arquitectura del lilium en una paleta monocromática de rosados. Un ramo femenino, atemporal y siempre acertado.</p><ul><li><strong>Composición estimada:</strong> 1 vara de lilium rosa, 1 rosa rosada importada, 2 varas de alstroemeria blanca, 1 vara de crisantemo o margarita rosa.</li></ul>',
    images: [
      `/assets/img/productos/ramosprivaverales/romance.jpeg?v=${BOUQUETS_SPRING_IMG_V}`,
    ],
    category: CATEGORIES["ramosPrimaverales"],
    price: {
      ars: {
        base: 65000,
        aument: 0,
      },
      usd: {
        base: 65,
        aument: 0,
      },
    },
  },
  {
    title: 'BLUSH GARDEN (Jardín Rubor)',
    description:
      '<p>Fresco como una mañana de primavera. Este diseño destaca por su riqueza de texturas: la elegancia del lisianthus, la alegría de la gerbera y la altura del gladiolo. Parece recién cortado de un jardín secreto.</p><ul><li><strong>Composición estimada:</strong> 1 gerbera fucsia, 1 vara de gladiolo (verde/rosado), 2 varas de lisianthus (rosa claro/doble), 1 vara de mini rosa (rosa), relleno: statice violeta y crisantemo blanco.</li></ul>',
    images: [
      `/assets/img/productos/ramosprivaverales/foto6.jpeg?v=${BLUSH_GARDEN_IMG_V}`,
    ],
    category: CATEGORIES["ramosPrimaverales"],
    price: {
      ars: {
        base: 50000,
        aument: 0,
      },
      usd: {
        base: 50,
        aument: 0,
      },
    },
  },
];
