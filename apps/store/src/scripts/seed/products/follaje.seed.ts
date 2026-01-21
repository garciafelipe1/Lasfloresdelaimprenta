import { CATEGORIES } from "@/shared/constants";

export const follaje = [
  {
    title: "Follaje Decorativo",
    description: "Follaje fresco para complementar tus arreglos florales.",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/follaje-decorativo.webp",
    ],
    category: CATEGORIES["bodas"], // ✅ Actualizado: productos de "Follaje" ahora están en "Bodas"
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
