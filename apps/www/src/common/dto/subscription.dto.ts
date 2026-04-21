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
