import { CATEGORIES } from "@/shared/constants";

export const box = [
  {
    title: "LILIUM & VIOLET",
    description:
      "<p>Distinción a primera vista. Los protagonistas son los <em>liliums blancos</em> (que perfuman riquísimo al abrir) acompañados por flores en tonos <em>violetas intensos</em>. El gran lazo de raso en el frente cierra el diseño con un toque de regalo importante.</p>",
    // El usuario cargará fotos luego desde el admin.
    images: [
      "https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/lilium.jpeg",
    ],
    category: CATEGORIES["box"],
    price: {
      ars: {
        base: 95000,
        aument: 0,
      },
      usd: {
        base: 95,
        aument: 0,
      },
    },
  },
  {
    title: "PINK SYMPHONY",
    description:
      "<p>Una orquesta de texturas en gama rosa. La majestuosidad de los <em>liliums</em> (que perfuman al abrir) es la protagonista, acompañada por la suavidad de las rosas, crisantemos y toques de estatice morado. El diseño se estructura con hojas de aspidistra curvadas y se cierra con un lazo de satén al tono.</p><p><strong>La Experiencia:</strong> Un centro de mesa romántico y sofisticado, listo para lucir sin necesidad de florero.</p>",
    images: [
      "https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/pinky.jpeg",
    ],
    category: CATEGORIES["box"],
    price: {
      ars: { base: 95000, aument: 0 },
      usd: { base: 95, aument: 0 },
    },
  },
  {
    title: "The Signature Box",
    description:
      "<p>Diseñado para quienes entienden que el impacto visual no admite improvisaciones. Este cofre de diseño editorial alberga una cúpula perfectamente simétrica de rosas de exportación, seleccionadas a mano por su textura aterciopelada y su apertura ideal.</p><p>El contraste entre la calidez de los tonos blush, la estructura rígida de nuestro empaque y el sellado característico de Las Flores de la Imprenta, convierten a esta pieza en una verdadera declaración de estatus.</p>",
    images: [
      "https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/IMG_5516.jpg",
    ],
    category: CATEGORIES["box"],
    price: {
      ars: { base: 95000, aument: 0 },
      usd: { base: 95, aument: 0 },
    },
  },
];
