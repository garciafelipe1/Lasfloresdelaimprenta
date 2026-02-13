import { SubscriptionWithMembership } from '@/common/dto/subscription.dto';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';

class UserService {
  async getSubscriptionInfo(): Promise<SubscriptionWithMembership | null> {
    const authHeaders = await cookies.getAuthHeaders();

    if (!('authorization' in authHeaders)) {
      return null;
    }

    try {
      const subscriptions = await medusa.client.fetch<
        SubscriptionWithMembership[]
      >('/membership/subscription/me', {
        headers: authHeaders,
      });

      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        return null;
      }

      return subscriptions[0];
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status ?? (error as { statusCode?: number })?.statusCode;
      if (status === 401) {
        return null;
      }
      return null;
    }
  }
}

export const userService = new UserService();
