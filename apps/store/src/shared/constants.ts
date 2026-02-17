export const CATEGORIES = {
  ramosPrimaverales: "Ramos primaverales",
  rosas: "Rosas",
  box: "Box",
  sanValentin: "Día de la Madre", // ✅ Categoría "Día de la Madre" (antes "San Valentín", migrada)
  complementosSanValentin: "Complemento Día de la Madre", // ✅ Complementos de Día de la Madre (antes "Complementos de San Valentín", migrada)
  complementos: "Complementos",
} as const;

// Categorías legacy para compatibilidad durante migración
export const LEGACY_CATEGORIES = {
  follaje: "Follaje", // Mantener para productos existentes
  bodas: "Bodas", // Mantener para productos existentes (redirige a "Día de la Madre")
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
