export const CATEGORIES = {
  ramosPrimaverales: "Ramos primaverales",
  rosas: "Rosas",
  box: "Box",
  sanValentin: "Diseños Exclusivos", // Categoría principal (antes "Día de la Mujer")
  complementosSanValentin: "Complementos Exclusivos", // Complementos (antes "Complemento Día de la Mujer")
  complementos: "Complementos",
} as const;

// Categorías legacy para compatibilidad durante migración
export const LEGACY_CATEGORIES = {
  follaje: "Follaje",
  bodas: "Bodas",
  diaDeLaMujer: "Día de la Mujer", // → Diseños Exclusivos
  complementoDiaDeLaMujer: "Complemento Día de la Mujer", // → Complementos Exclusivos
} as const;

export const SIZES = ["S", "M", "XXL"];
export const ROSAS_QUANTITY = ["3", "6", "9", "12"];

export const sortOptions = [
  { label: "Precio: menor a mayor", value: "price_asc" },
  { label: "Precio: mayor a menor", value: "price_desc" },
  { label: "Nuevos primero", value: "created_at_desc" },
  { label: "Antiguos primero", value: "created_at_asc" },
] as const;

export const BAHIA_BLANCA_SHIPPING_CODES = {
  bahiaBlanca: "bahia-blanca",
  retiroLocal: "retiro-local",
  envioAConfirmar: "envio-a-confirmar",
};

export const sortOptionValues = sortOptions.map(
  (o) => o.value
) as (typeof sortOptions)[number]["value"][];

export type MembershipId = "esencial" | "premium" | "elite";

export type MembershipColors = {
  [key in MembershipId]: {
    bg: string;
    accent: string;
  };
};

export const MANUAL_PAYMENT_PROVIDER_ID = "pp_system_default";

// Re-exportar category-mapping para uso en otros módulos
export * from "./category-mapping";
