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
        base: 90000,
        aument: 0,
      },
      usd: {
        base: 90,
        aument: 0,
      },
    },
  },
  {
    title: "FRESH VIBRANT",
    description:
      "<p>Energía y luz. Un diseño alegre donde mezclamos <em>liliums frescos</em> con <em>rosas pequeñas</em> en color <em>fucsia vibrante</em>. Es una combinación llena de vida, perfecta para regalar optimismo o celebrar un cumpleaños.</p>",
    images: [
      "https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/IMG-20251019-WA0009.jpeg",
    ],
    category: CATEGORIES["box"],
    price: {
      ars: { base: 90000, aument: 0 },
      usd: { base: 90, aument: 0 },
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
      ars: { base: 90000, aument: 0 },
      usd: { base: 90, aument: 0 },
    },
  },
];
