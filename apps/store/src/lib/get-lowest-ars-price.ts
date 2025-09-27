import { ProductCustom } from "@/api/store/custom/route";

export function getLowestARSPrice(product: ProductCustom): number {
  let lowestPrice = Infinity;

  for (const variant of product.variants || []) {
    const amount = variant.calculated_price?.calculated_amount;

    if (typeof amount === "number") {
      lowestPrice = Math.min(lowestPrice, amount);
    }
  }

  return lowestPrice === Infinity ? 0 : lowestPrice;
}
