import type { MembershipType, SubscriptionType } from '@server/types';

export type SubscriptionWithMembership = SubscriptionType & {
  membership: MembershipType;
};
