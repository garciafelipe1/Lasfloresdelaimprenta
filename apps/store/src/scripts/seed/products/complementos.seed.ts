import { CATEGORIES } from "@/shared/constants";

export const complementos = [
  {
    title: "Florero de Cristal Clásico",
    description:
      "Un florero de cristal clásico, perfecto para cualquier arreglo floral.",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/florero-crista.webp",
    ],
    category: CATEGORIES["complementos"],
    price: {
      ars: {
        base: 5000,
        aument: 1000,
      },
      usd: {
        base: 5,
        aument: 1,
      },
    },
    variant: {
      name: "Altura",
      options: ["15cm", "25cm", "35cm"],
    },
  },
  {
    title: "Florero de Cerámica Rústico",
    description:
      "Un florero de cerámica con acabado rústico, ideal para un toque campestre.",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/florero-rustico-1.webp",
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/florero-rustico-2.webp",
    ],
    category: CATEGORIES["complementos"],
    price: {
      ars: {
        base: 4000,
        aument: 800,
      },
      usd: {
        base: 4,
        aument: 0.8,
      },
    },
    variant: {
      name: "Altura",
      options: ["15cm", "25cm", "35cm"],
    },
  },
  {
    title: "Florero de Vidrio Moderno",
    description:
      "Un florero de diseño moderno, ideal para arreglos contemporáneos.",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/florero-vidrio.webp",
    ],
    category: CATEGORIES["complementos"],
    price: {
      ars: {
        base: 6000,
        aument: 700,
      },
      usd: {
        base: 6,
        aument: 0.7,
      },
    },
    variant: {
      name: "Color",
      options: ["Transparente", "Gris", "Ámbar"],
    },
  },
  {
    title: "Vela Aromática de Lavanda",
    description:
      "Vela artesanal con un relajante aroma a lavanda, ideal para ambientar cualquier espacio.",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/velas-lavanda.webp",
    ],
    category: CATEGORIES["complementos"],
    price: {
      ars: {
        base: 2500,
        aument: 500,
      },
      usd: {
        base: 2.5,
        aument: 0.5,
      },
    },
    variant: {
      name: "Tamaño",
      options: ["15cm", "30cm"],
    },
  },
  {
    title: "Difusor de Ambiente Vainilla",
    description:
      "Difusor de ambiente con varillas, con un dulce y cálido aroma a vainilla.",
    images: [
      "https://pub-9eabcb4d57274edea31fd1667fff4c88.r2.dev/la-floreria-de-la-imprenta/difusor-vainilla.webp",
    ],
    category: CATEGORIES["complementos"],
    price: {
      ars: {
        base: 3500,
        aument: 1000,
      },
      usd: {
        base: 3.5,
        aument: 1,
      },
    },
    variant: {
      name: "Volumen",
      options: ["100ml", "200ml"],
    },
  },
];
