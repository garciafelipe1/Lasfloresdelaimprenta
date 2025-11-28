import { SubscriptionWithMembership } from '@/common/dto/subscription.dto';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';

class UserService {
  async getSubscriptionInfo(): Promise<SubscriptionWithMembership | null> {
    const authHeaders = await cookies.getAuthHeaders();

    // 👇 Si no hay header Authorization, no hay usuario autenticado
    if (!('authorization' in authHeaders)) {
      return null;
    }

    try {
      // OJO: medusa.client.fetch devuelve directamente el body ya parseado,
      // NO es un Response. Si la respuesta es 401/403/500, lanza un Error.
      const subscriptions = await medusa.client.fetch<
        SubscriptionWithMembership[]
      >('/membership/subscription/me', {
        headers: authHeaders,
      });

      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        return null;
      }

      return subscriptions[0];
    } catch (error) {
      console.error(
        '[userService.getSubscriptionInfo] Error al obtener subscripción',
        error
      );
      // Si falla (401, 500, etc.), devolvemos null en vez de romper el render
      return null;
    }
  }
}

export const userService = new UserService();
