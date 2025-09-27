import { StoreProduct } from '@medusajs/types';
import { CATEGORIES } from '@server/constants';

export function isComplement(categories: StoreProduct['categories']) {
  return (
    categories?.some((c) => c.name === CATEGORIES['complementos']) ?? false
  );
}
