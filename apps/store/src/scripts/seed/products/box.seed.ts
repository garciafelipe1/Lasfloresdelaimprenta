import { CATEGORIES } from "@/shared/constants";

export const box = [
  {
    title: "Box de rosas y flores de estación",
    description:
      "<p>Una combinación única de <em>rosas frescas</em> con flores de estación seleccionadas a mano. Este box es ideal para regalar en cualquier ocasión: desde un cumpleaños hasta un gesto espontáneo. Viene presentado en una elegante caja, lista para sorprender.</p>",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/box-1.webp",
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/box-2.webp",
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/box-3.webp",
    ],
    category: CATEGORIES["box"],
    price: {
      ars: {
        base: 10000,
        aument: 3000,
      },
      usd: {
        base: 10,
        aument: 2,
      },
    },
  },
];
