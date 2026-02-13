import { ProductCustom } from "@/api/store/custom/route";

/** Categoría "Diseños exclusivos" eliminada: siempre false. */
export function isExclusiveProduct(_product: ProductCustom): boolean {
  return false;
}
