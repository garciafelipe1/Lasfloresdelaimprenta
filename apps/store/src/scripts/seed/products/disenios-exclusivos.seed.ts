/**
 * Seed de productos de la categoría "Diseños Exclusivos".
 * Categoría en DB: CATEGORIES.sanValentin ("Diseños Exclusivos").
 */
import { CATEGORIES } from "@/shared/constants";

const CATEGORY = CATEGORIES.sanValentin;

export type DiseniosExclusivosSeedItem = {
  title: string;
  description: string;
  images: string[];
  category: string;
  metadata: Record<string, unknown>;
  price: { ars: { base: number; aument: number }; usd: { base: number; aument: number } };
};

export const diseniosExclusivos: DiseniosExclusivosSeedItem[] = [
  {
    title: "THE NEUTRAL PALETTE.",
    description:
      "<p>Una paleta de tonos nude, durazno y blancos puros que aporta luminosidad y elegancia contemporánea. Diseño botánico pensado para integrarse a la perfección en arquitecturas modernas y oficinas de diseño limpio.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/Admiraci%C3%B3nSutil.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos", exclusive: true },
    price: { ars: { base: 90000, aument: 0 }, usd: { base: 90, aument: 0 } },
  },
  {
    title: "THE SCARLET STRUCTURE.",
    description:
      "<p>Diseño de líneas fuertes y contrastes definidos. Rosas rojas presentadas en un packaging de Alta Costura tonal, equilibrado con sutiles destellos blancos. Una pieza de carácter resolutivo.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/fuerzayequilibrio.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos" },
    price: { ars: { base: 164000, aument: 0 }, usd: { base: 164, aument: 0 } },
  },
  {
    title: "VIBRANT CORAL EDIT.",
    description:
      "<p>Energía visual y vanguardia. Una selección de rosas en tonos coral vibrante y verdes estructurados. La elección perfecta para estudios creativos, agencias o para aportar un punto focal dinámico a cualquier recepción.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/energiacreadora.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos" },
    price: { ars: { base: 190000, aument: 0 }, usd: { base: 190, aument: 0 } },
  },
  {
    title: "THE MASTERPIECE RED.",
    description:
      "<p>Pieza de gran escala diseñada para generar un impacto visual inmediato. Rosas rojas importadas y texturas blancas estructuradas en un ensamble de autoridad absoluta. Ideal para agasajos corporativos de alto nivel y presidencia de espacios.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/reconocimientoabsoluto.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos" },
    price: { ars: { base: 310000, aument: 0 }, usd: { base: 310, aument: 0 } },
  },
  {
    title: "THE CORPORATE RED.",
    description:
      "<p>Sobriedad y fuerza visual. Una curaduría de rosas rojas estructuradas sobre follajes profundos. El estándar botánico indiscutible para transmitir respeto, solidez y liderazgo en cualquier entorno profesional.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/mujerlider.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos" },
    price: { ars: { base: 230000, aument: 0 }, usd: { base: 230, aument: 0 } },
  },
  {
    title: "CRIMSON MONOCHROME.",
    description:
      "<p>El poder del diseño monocromático. Una selección estricta de texturas florales en tonos carmesí y burdeos. Creado para líderes que buscan una estética imponente, profunda y sin distracciones visuales.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/determinacionpura.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos" },
    price: { ars: { base: 190000, aument: 0 }, usd: { base: 190, aument: 0 } },
  },
  {
    title: "THE BLUSH MINIMAL.",
    description:
      "<p>La máxima expresión de la sutileza. Texturas en tonos blush, rosas pálidos y neutros ensambladas en una composición de caída natural. Diseñado para espacios que exigen una presencia serena y distinguida.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/eleganciaygracia.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos" },
    price: { ars: { base: 90000, aument: 0 }, usd: { base: 90, aument: 0 } },
  },
  {
    title: "THE SIGNATURE HATBOX.",
    description:
      "<p>Arquitectura floral en formato cilíndrico. Rosas de calidad exportación dispuestas en nuestra hatbox de diseño exclusivo. Una pieza moderna y pulcra que no requiere florero, ideal para directorios o escritorios gerenciales.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/boxvanguardiafemenil.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos" },
    price: { ars: { base: 170000, aument: 0 }, usd: { base: 170, aument: 0 } },
  },
  {
    title: "THE LILY & ROSE EDIT.",
    description:
      "<p>La sofisticación del contraste. Rosas rojas premium fusionadas con la elegancia arquitectónica de los liliums blancos. Un diseño de autor envuelto en texturas puras, pensado para declaraciones de prestigio y corporate gifting.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/escenciainolvidable.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos" },
    price: { ars: { base: 164000, aument: 0 }, usd: { base: 164, aument: 0 } },
  },
  {
    title: "THE PREMIUM ROUGE.",
    description:
      "<p>Nuestro diseño clásico, elevado a la categoría de lujo. Rosas rojas seleccionadas a mano, presentadas en un packaging de capas dobles y terminaciones en cinta de seda. Un obsequio infalible para socios estratégicos.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/edicionoro.jpeg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos", exclusive: true },
    price: { ars: { base: 154000, aument: 0 }, usd: { base: 154, aument: 0 } },
  },
  {
    title: "THE PETITE GESTURE.",
    description:
      "<p>El detalle elevado a la categoría de Alta Costura. Conos de diseño minimalista con una selección botánica sutil y chocolatería de cortesía. Ideal para atenciones a gran escala en eventos corporativos y lanzamientos.</p>",
    images: [
      "https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/Flower-bag-1.jpg",
      "https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/Flower-bag-1_1.jpg",
    ],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos", noVariations: true, exclusive: true },
    price: { ars: { base: 75000, aument: 0 }, usd: { base: 75, aument: 0 } },
  },
  {
    title: "THE DYNAMIC CENTERPIECE.",
    description:
      "<p>Arquitectura floral lista para exhibir. Una fusión de colores vivos y líneas asimétricas presentadas en jarrón de cristal, rompiendo con la monotonía. Diseñado para ser el centro de atención en salas de reuniones o eventos ejecutivos de día.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/bouquet%20spring%20en%20florero%20de%20cristal.png"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos", noVariations: true, exclusive: true },
    price: { ars: { base: 90000, aument: 0 }, usd: { base: 90, aument: 0 } },
  },
  {
    title: "THE CURATED EXPERIENCE BOX.",
    description:
      "<p>Más que un diseño floral, una experiencia sensorial completa. Combina texturas botánicas vibrantes con velas aromáticas y chocolatería premium. El obsequio definitivo para fidelizar clientes VIP.</p>",
    images: ["https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/Box-floral-.jpg"],
    category: CATEGORY,
    metadata: { occasion: "Diseños Exclusivos", noVariations: true, exclusive: true },
    price: { ars: { base: 100000, aument: 0 }, usd: { base: 100, aument: 0 } },
  },
];
