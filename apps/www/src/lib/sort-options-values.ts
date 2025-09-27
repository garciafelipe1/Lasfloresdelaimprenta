import { StoreProductOption } from '@medusajs/types';

export function sortProductOptionValues(option: StoreProductOption) {
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  return option.values?.slice().sort((a, b) => {
    const aValue = a.value;
    const bValue = b.value;

    // Check if both values are numeric
    const aIsNumeric = !isNaN(Number(aValue));
    const bIsNumeric = !isNaN(Number(bValue));

    if (aIsNumeric && bIsNumeric) {
      // Sort numeric values in ascending order
      return Number(aValue) - Number(bValue);
    }

    // Sort based on predefined order for sizes
    const aIndex = order.indexOf(aValue);
    const bIndex = order.indexOf(bValue);

    if (aIndex === -1 && bIndex === -1) {
      // Sort alphabetically if neither value is in the predefined order
      return aValue.localeCompare(bValue);
    }
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
}
