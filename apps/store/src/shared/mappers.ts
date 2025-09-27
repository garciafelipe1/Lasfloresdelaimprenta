import { StoreProduct } from "@medusajs/framework/types";
import { ProductDTO } from "./types";

export function mapProductDTO(storeProduct: StoreProduct): ProductDTO {
  return {
    categories: storeProduct.categories ?? [],
    description: storeProduct.description!,
    handle: storeProduct.handle,
    id: storeProduct.id,
    images: storeProduct.images ?? [],
    thumbnail: storeProduct.thumbnail!,
    title: storeProduct.title,
    // @ts-expect-error
    variants: storeProduct.variants ?? [],
  };
}
