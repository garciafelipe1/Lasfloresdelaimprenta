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

  async cancelSubscription(): Promise<{ message: string; cancelledSubscriptions: string[] }> {
    const authHeaders = await cookies.getAuthHeaders();

    if (!('authorization' in authHeaders)) {
      throw new Error('No autorizado');
    }

    try {
      const response = await medusa.client.fetch<{
        message: string;
        cancelledSubscriptions: string[];
      }>('/membership/subscription/me/cancel', {
        method: 'PUT',
        headers: authHeaders,
      });

      return response;
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status ?? (error as { statusCode?: number })?.statusCode;
      const message = (error as { message?: string })?.message ?? 'Error al cancelar la suscripción';
      
      if (status === 401) {
        throw new Error('No autorizado');
      }
      
      if (status === 404) {
        throw new Error('No se encontró una suscripción activa para cancelar');
      }
      
      throw new Error(message);
    }
  }
}

export const userService = new UserService();
