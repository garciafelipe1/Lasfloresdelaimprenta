import { INNER_CIRCLE_METADATA } from './inner-circle-metadata';
import {
  canApplyCatalogPromoOverCart,
  cartHasOnlyMembershipProducts,
  CART_PROMO_RETRIEVE_FIELDS,
  getExistingPromoCodesUpper,
  getWelcomeCodeUpper,
  resolveCartPromoCustomerMetadata,
  updateCartWithPromoCode,
  type CartPromoApplyOptions,
} from './cart-promo-shared';
import { medusa } from '@/lib/medusa-client';

/**
 * Miembros Inner Circle: aplica el cupón de catálogo (5/7/10%) si corresponde.
 * Prioridad sobre el cupón de bienvenida (reemplaza si solo había bienvenida).
 */
export async function applyInnerCirclePromoToCartIfEligible(
  cartId: string,
  options?: CartPromoApplyOptions,
): Promise<void> {
  const meta = await resolveCartPromoCustomerMetadata(options);
  if (!meta) {
    return;
  }

  const codeRaw = meta[INNER_CIRCLE_METADATA.promoCode];
  if (typeof codeRaw !== 'string' || !codeRaw.trim()) {
    return;
  }

  const promoCode = codeRaw.trim().toUpperCase();

  const { cart } = await medusa.store.cart.retrieve(cartId, {
    fields: CART_PROMO_RETRIEVE_FIELDS,
  });

  if (!cart?.items?.length) {
    return;
  }

  if (cartHasOnlyMembershipProducts(cart)) {
    return;
  }

  const existingCodes = getExistingPromoCodesUpper(cart);

  if (existingCodes.includes(promoCode)) {
    return;
  }

  const welcomeCode = getWelcomeCodeUpper(meta);

  if (!canApplyCatalogPromoOverCart(existingCodes, welcomeCode)) {
    return;
  }

  try {
    await updateCartWithPromoCode(cartId, promoCode);
  } catch (e) {
    console.warn('[applyInnerCirclePromoToCartIfEligible]', e);
  }
}
