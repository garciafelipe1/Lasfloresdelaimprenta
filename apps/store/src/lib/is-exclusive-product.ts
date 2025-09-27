import { ProductCustom } from "@/api/store/custom/route";
import { CATEGORIES } from "@/shared/constants";

export function isExclusiveProduct(product: ProductCustom): boolean {
  return (
    product.categories?.some(
      (category) => category.name === CATEGORIES["diseniosExclusivos"]
    ) ?? false
  );
}
