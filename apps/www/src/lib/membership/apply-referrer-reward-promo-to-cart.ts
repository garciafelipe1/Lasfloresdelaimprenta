import { REFERRAL_METADATA } from './referral-metadata';
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
 * Recompensa 10% al referidor (cupón RV-… emitido al confirmarse compra de membresía del referido).
 */
export async function applyReferrerRewardPromoToCartIfEligible(
  cartId: string,
  options?: CartPromoApplyOptions,
): Promise<void> {
  const meta = await resolveCartPromoCustomerMetadata(options);
  if (!meta) {
    return;
  }

  const codeRaw = meta[REFERRAL_METADATA.referrerRewardPromoCode];
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
    console.warn('[applyReferrerRewardPromoToCartIfEligible]', e);
  }
}
