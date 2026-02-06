import { StoreProductOption } from '@medusajs/types';

export function sortProductOptionValues(option: StoreProductOption) {
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const values = option.values?.slice() ?? [];

  // Caso especial: variaciones tipo "X3", "X6 + 1 Lilium", etc.
  // Orden: numérico por X{n} y, para el mismo n, primero el simple y luego "+ 1 Lilium".
  const looksLikeXQuantity = values.length
    ? values.every((v) => /^X\d+/i.test(v.value))
    : false;

  if (looksLikeXQuantity) {
    return values.sort((a, b) => {
      const aMatch = a.value.match(/^X(\d+)/i);
      const bMatch = b.value.match(/^X(\d+)/i);
      const aNum = aMatch ? Number(aMatch[1]) : Number.POSITIVE_INFINITY;
      const bNum = bMatch ? Number(bMatch[1]) : Number.POSITIVE_INFINITY;
      if (aNum !== bNum) return aNum - bNum;

      const aHasLilium = /lilium/i.test(a.value);
      const bHasLilium = /lilium/i.test(b.value);
      if (aHasLilium !== bHasLilium) return aHasLilium ? 1 : -1;

      return a.value.localeCompare(b.value);
    });
  }

  return values.sort((a, b) => {
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
