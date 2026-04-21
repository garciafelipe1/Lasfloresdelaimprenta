import {
  cartHasOnlyMembershipProducts,
  CART_PROMO_RETRIEVE_FIELDS,
  getExistingPromoCodesUpper,
  resolveCartPromoCustomerMetadata,
  updateCartWithPromoCode,
  type CartPromoApplyOptions,
} from '@/lib/membership/cart-promo-shared';
import { medusa } from '@/lib/medusa-client';
import { WELCOME_METADATA } from './metadata-keys';

function parseIso(s: unknown): Date | null {
  if (typeof s !== 'string') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isTruthyConsumed(v: unknown): boolean {
  return v === true || v === 'true';
}

/**
 * Si el cliente tiene cupón de bienvenida vigente y el carrito tiene ítems,
 * aplica el código promocional único (sin exponerlo al cliente).
 */
export async function applyWelcomePromoToCartIfEligible(
  cartId: string,
  options?: CartPromoApplyOptions,
): Promise<void> {
  const meta = await resolveCartPromoCustomerMetadata(options);
  if (!meta) {
    return;
  }

  if (!meta[WELCOME_METADATA.profileCompletedAt]) {
    return;
  }

  if (isTruthyConsumed(meta[WELCOME_METADATA.promoConsumed])) {
    return;
  }

  const until = parseIso(meta[WELCOME_METADATA.promoEligibleUntil]);
  if (!until || until.getTime() < Date.now()) {
    return;
  }

  const codeRaw = meta[WELCOME_METADATA.promoCode];
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

  // Una sola promoción por pedido: si ya hay otro código, no auto-aplicar bienvenida.
  if (
    existingCodes.length > 0 &&
    !existingCodes.every((c) => c === promoCode)
  ) {
    return;
  }

  try {
    await updateCartWithPromoCode(cartId, promoCode);
  } catch (e) {
    console.warn('[applyWelcomePromoToCartIfEligible]', e);
  }
}
