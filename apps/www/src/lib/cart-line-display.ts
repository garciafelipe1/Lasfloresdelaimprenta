import type { StoreCartLineItem } from '@medusajs/types';

/**
 * Título del producto para UI de carrito/checkout: prioriza el producto “vivo”
 * (relación variant.product o product) sobre el snapshot en line item.
 */
export function getCartLineItemProductTitle(item: StoreCartLineItem): string {
  const v = item as Record<string, unknown>;
  const variant = v.variant as Record<string, unknown> | undefined;
  const variantProduct = variant?.product as Record<string, unknown> | undefined;
  const product = v.product as Record<string, unknown> | undefined;

  const fromVariantProduct =
    typeof variantProduct?.title === 'string' ? variantProduct.title.trim() : '';
  const fromProduct = typeof product?.title === 'string' ? product.title.trim() : '';
  const fallback = typeof item.title === 'string' ? item.title.trim() : '';

  return (fromVariantProduct || fromProduct || fallback || 'Producto').trim();
}

/**
 * Subtítulo de variante/opción sin repetir un posible prefijo viejo en item.title
 * (Medusa suele guardar "Producto / X6" en la línea).
 */
export function getCartLineItemVariantLabel(
  item: StoreCartLineItem,
  productTitle: string,
): string | null {
  const raw = typeof item.title === 'string' ? item.title.trim() : '';
  if (!raw) return null;
  if (raw.toLowerCase() === 'default') return null;
  if (raw === productTitle) return null;

  const parts = raw.split(' / ').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const suffix = parts.slice(1).join(' / ');
    return suffix || null;
  }

  const only = parts[0];
  if (!only || only === productTitle) return null;
  if (/^X\d/i.test(only) || only.includes('+')) return only;

  return null;
}
