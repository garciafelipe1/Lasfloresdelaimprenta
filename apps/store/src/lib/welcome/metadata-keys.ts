/** Claves compartidas (store + www) para el flujo bienvenida / cupón primera compra. */
export const WELCOME_METADATA = {
  /** Solo cuentas nuevas (registro Google / email) deben ver el formulario y el cupón. */
  offerEligible: "welcome_offer_eligible",
  profileCompletedAt: "welcome_profile_completed_at",
  promoEligibleUntil: "welcome_promo_eligible_until",
  promoCode: "welcome_promo_code",
  promoPromotionId: "welcome_promo_promotion_id",
  promoConsumed: "welcome_promo_consumed",
  instagram: "instagram_username",
  flowerPreference: "flower_preference",
  age: "age",
  gender: "gender",
} as const;
