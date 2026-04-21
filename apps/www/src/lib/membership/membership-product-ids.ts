/**
 * IDs de productos considerados "membresía" (mismo criterio que
 * WELCOME_PROMO_EXCLUDE_MEMBERSHIP_PRODUCT_IDS en el backend).
 * Usado para no auto-aplicar cupones de catálogo/bienvenida si el carrito solo tiene membresías.
 */
export function getMembershipProductIdsFromEnv(): string[] {
  const raw = process.env.NEXT_PUBLIC_MEMBERSHIP_PRODUCT_IDS;
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getLineItemProductId(item: unknown): string | undefined {
  const i = item as Record<string, unknown>;
  const variant = i.variant as Record<string, unknown> | undefined;
  const variantProduct = variant?.product as { id?: string } | undefined;
  const product = i.product as { id?: string } | undefined;
  const direct = i.product_id;
  return (
    product?.id ??
    variantProduct?.id ??
    (typeof direct === 'string' ? direct : undefined)
  );
}
