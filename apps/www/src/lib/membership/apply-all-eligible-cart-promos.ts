import { applyInnerCirclePromoToCartIfEligible } from '@/lib/membership/apply-inner-circle-promo-to-cart';
import { applyRefereeReferralPromoToCartIfEligible } from '@/lib/membership/apply-referee-referral-promo-to-cart';
import { applyReferrerRewardPromoToCartIfEligible } from '@/lib/membership/apply-referrer-reward-promo-to-cart';
import {
  resolveCartPromoCustomerMetadata,
  type CartPromoApplyOptions,
} from '@/lib/membership/cart-promo-shared';
import { applyWelcomePromoToCartIfEligible } from '@/lib/welcome/apply-welcome-promo-to-cart';

/**
 * Aplica en orden los cupones automáticos del carrito: recompensa referidor (RV),
 * Inner Circle, referido (RR), bienvenida. Una sola lectura de metadata del cliente.
 *
 * Tras cada paso el carrito puede cambiar en Medusa; cada función vuelve a leer el carrito.
 */
export async function applyAllEligibleCartPromos(
  cartId: string,
  options?: CartPromoApplyOptions,
): Promise<void> {
  const meta = await resolveCartPromoCustomerMetadata(options);
  if (!meta) {
    return;
  }

  const shared: CartPromoApplyOptions = { customerMetadata: meta };

  await applyReferrerRewardPromoToCartIfEligible(cartId, shared);
  await applyInnerCirclePromoToCartIfEligible(cartId, shared);
  await applyRefereeReferralPromoToCartIfEligible(cartId, shared);
  await applyWelcomePromoToCartIfEligible(cartId, shared);
}
