import type { MembershipType, SubscriptionType } from '@server/types';

export type SubscriptionWithMembership = SubscriptionType & {
  membership: MembershipType;
};

/** Respuesta de GET /membership/subscription/me (Medusa). */
export type InnerCircleInfo = {
  tier: 'solido' | 'senior' | 'vip';
  labelEs: string;
  catalogDiscountPercent: number;
  memberSince: string;
  source: 'auto' | 'manual';
};

export type ReferralInfo = {
  ownCode: string | null;
  /** Días hasta poder usar el código propio; null si ya aplica. */
  daysUntilEligible: number | null;
  /** Cantidad total de cuentas que se registraron con tu código. */
  referredTotal?: number;
  /** Últimos referidos (máx 8). */
  recentReferees?: { id: string; email: string | null; createdAt: string | null }[];
  /** Recompensas otorgadas este mes (por compras de membresía de tus referidos). */
  rewardsGrantedThisMonth?: number;
  /** Última vez que se otorgó recompensa al referidor (best-effort). */
  lastRewardAt?: string | null;
};

export type SubscriptionMeApiPayload = {
  subscriptions: SubscriptionWithMembership[];
  innerCircle: InnerCircleInfo | null;
  referral: ReferralInfo | null;
};

export type SubscriptionDashboardInfo = {
  subscription: SubscriptionWithMembership | null;
  innerCircle: InnerCircleInfo | null;
  referral: ReferralInfo | null;
};
