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
 * Cupón 10% del referido (RR-… al vincular código en registro / attach).
 */
export async function applyRefereeReferralPromoToCartIfEligible(
  cartId: string,
  options?: CartPromoApplyOptions,
): Promise<void> {
  const meta = await resolveCartPromoCustomerMetadata(options);
  if (!meta) {
    return;
  }

  const codeRaw = meta[REFERRAL_METADATA.refereePromoCode];
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
    console.warn('[applyRefereeReferralPromoToCartIfEligible]', e);
  }
}
