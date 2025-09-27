import { SubscriptionWithMembership } from '@/common/dto/subscription.dto';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';

class UserService {
  async getSubscriptionInfo(): Promise<SubscriptionWithMembership | null> {
    const authHeaders = await cookies.getAuthHeaders();

    if (!authHeaders) {
      throw new Error('User not logged in');
    }

    const response = await medusa.client.fetch<SubscriptionWithMembership[]>(
      '/membership/subscription/me',
      {
        headers: authHeaders,
      },
    );

    return response[0];
  }
}

export const userService = new UserService();
