import { StoreProduct } from '@medusajs/types';
import { CATEGORIES } from '@server/constants';

export function canHaveMessage(categories: StoreProduct['categories']) {
  return (
    categories?.some(
      (c) =>
        c.name === CATEGORIES['ramosPrimaverales'] ||
        c.name === CATEGORIES['box'] ||
        c.name === CATEGORIES['rosas'],
    ) ?? false
  );
}
