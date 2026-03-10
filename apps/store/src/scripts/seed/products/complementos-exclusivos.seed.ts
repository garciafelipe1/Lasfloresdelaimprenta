/**
 * Seed de complementos de la categoría "Complementos Exclusivos".
 * Categoría en DB: CATEGORIES.complementosSanValentin ("Complementos Exclusivos").
 */
import { CATEGORIES } from "@/shared/constants";

const CATEGORY = CATEGORIES.complementosSanValentin;
const IMG_BASE = "/assets/img/productos/sanvalentincomplementos";

export const complementosExclusivos = [
  {
    title: "Caja de X3 bombones Ferrero Rocher",
    description: "",
    images: [`${IMG_BASE}/Caja de X3 bombones Ferrero Rocher.png`],
    category: CATEGORY,
    metadata: { brand: "Ferrero Rocher", occasion: "Diseños Exclusivos", type: "complemento" },
    price: { ars: { base: 15000, aument: 0 }, usd: { base: 15, aument: 0 } },
    variant: { name: "Presentación", options: ["Default"] },
  },
  {
    title: "Caja de X4 bombones Ferrero Rocher",
    description: "",
    images: [`${IMG_BASE}/Caja de X4 bombones Ferrero Rocher.png`],
    category: CATEGORY,
    metadata: { brand: "Ferrero Rocher", occasion: "Diseños Exclusivos", type: "complemento" },
    price: { ars: { base: 20000, aument: 0 }, usd: { base: 20, aument: 0 } },
    variant: { name: "Presentación", options: ["Default"] },
  },
  {
    title: "Caja de X8 bombones Ferrero Rocher",
    description: "",
    images: [`${IMG_BASE}/Caja de X8 bombones Ferrero Rocher.png`],
    category: CATEGORY,
    metadata: { brand: "Ferrero Rocher", occasion: "Diseños Exclusivos", type: "complemento" },
    price: { ars: { base: 35000, aument: 0 }, usd: { base: 35, aument: 0 } },
    variant: { name: "Presentación", options: ["Default"] },
  },
  {
    title: "Caja de X12 bombones Ferrero Rocher",
    description: "",
    images: [`${IMG_BASE}/Caja de X12 bombones Ferrero Rocher.png`],
    category: CATEGORY,
    metadata: { brand: "Ferrero Rocher", occasion: "Diseños Exclusivos", type: "complemento" },
    price: { ars: { base: 50000, aument: 0 }, usd: { base: 50, aument: 0 } },
    variant: { name: "Presentación", options: ["Default"] },
  },
  {
    title: "Caja de X24 bombones Ferrero Rocher",
    description: "",
    images: [`${IMG_BASE}/Caja de X24 bombones Ferrero Rocher.png`],
    category: CATEGORY,
    metadata: { brand: "Ferrero Rocher", occasion: "Diseños Exclusivos", type: "complemento" },
    price: { ars: { base: 90000, aument: 0 }, usd: { base: 90, aument: 0 } },
    variant: { name: "Presentación", options: ["Default"] },
  },
];
