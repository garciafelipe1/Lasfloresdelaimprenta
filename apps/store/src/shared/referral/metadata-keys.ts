/** Código propio del miembro (visible tras antigüedad mínima). */
export const REFERRAL_OWN_CODE_KEY = "referral_own_code";

/** ISO: desde cuándo cuenta la antigüedad para mostrar código (primera membresía). */
export const REFERRAL_ELIGIBLE_SINCE_KEY = "referral_eligible_since";

/** Customer id del referidor (quien compartió el código al registrarse el referido). */
export const REFERRAL_REFERRER_CUSTOMER_ID_KEY = "referral_referrer_customer_id";

/** Cupón 10% catálogo para el referido (1 uso, 30 días). */
export const REFERRAL_REFEREE_PROMO_CODE_KEY = "referral_referee_promo_code";
export const REFERRAL_REFEREE_PROMO_ID_KEY = "referral_referee_promo_promotion_id";

/** Prefijo metadata contador de recompensas al referidor por mes: `referral_grant_count_2026-04`. */
export function referralGrantCountKey(ym: string): string {
  return `referral_grant_count_${ym}`;
}

/**
 * JSON string[] en metadata del referidor: órdenes de membresía ya recompensadas
 * (idempotencia si `order.placed` se dispara más de una vez).
 */
export const REFERRAL_REFERRER_REWARD_ORDER_IDS_KEY =
  "referral_referrer_reward_order_ids";
