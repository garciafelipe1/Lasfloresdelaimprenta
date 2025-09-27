import { CATEGORIES } from "@/shared/constants";

export const rosas = [
  {
    title: "Rosas Nacionales",
    description:
      "<p>Cultivadas con dedicación en suelo argentino, nuestras rosas nacionales ofrecen belleza natural a un excelente precio. Colores vibrantes y frescura garantizada. Una opción clásica que nunca falla.</p>",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/rosa-nacional.jpg",
    ],
    category: CATEGORIES["rosas"],
    price: {
      ars: {
        base: 1000,
        aument: 1000,
      },
      usd: {
        base: 3,
        aument: 3,
      },
    },
  },
  {
    title: "Rosas Premium",
    description:
      "<p>Rosas importadas de tallo largo y botones grandes. Su color intenso y su duración superior las convierten en la opción ideal para quienes buscan <em>impactar con elegancia</em>. Perfectas para aniversarios, propuestas o momentos especiales.</p>",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/rosa.jpg",
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/rosa-2.jpg",
    ],
    category: CATEGORIES["rosas"],
    price: {
      ars: {
        base: 1500,
        aument: 1500,
      },
      usd: {
        base: 5,
        aument: 5,
      },
    },
  },
];
