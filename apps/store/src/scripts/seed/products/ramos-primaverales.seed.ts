import { CATEGORIES } from "@/shared/constants";

export const ramosPrimaverales = [
  {
    title: "Ramo primaveral",
    description:
      "<p>Un ramo alegre y colorido que captura la esencia de la primavera. Compuesto por flores de estación como margaritas, lilium, fresias y más, según disponibilidad. Ideal para alegrar cualquier rincón o regalar pura energía positiva.</p>",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/ramo-flores-primaveral.webp",
    ],
    category: CATEGORIES["ramosPrimaverales"],
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
