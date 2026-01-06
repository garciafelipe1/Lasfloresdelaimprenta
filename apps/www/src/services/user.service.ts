import { SubscriptionWithMembership } from '@/common/dto/subscription.dto';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';

class UserService {
  async getSubscriptionInfo(): Promise<SubscriptionWithMembership | null> {
    const authHeaders = await cookies.getAuthHeaders();

    // 👇 Si no hay header Authorization, no hay usuario autenticado
    if (!('authorization' in authHeaders)) {
      console.log('[userService.getSubscriptionInfo] No hay header Authorization. Usuario no autenticado.');
      return null;
    }

    try {
      console.log('[userService.getSubscriptionInfo] Obteniendo suscripciones del backend...');
      // OJO: medusa.client.fetch devuelve directamente el body ya parseado,
      // NO es un Response. Si la respuesta es 401/403/500, lanza un Error.
      const subscriptions = await medusa.client.fetch<
        SubscriptionWithMembership[]
      >('/membership/subscription/me', {
        headers: authHeaders,
      });

      console.log('[userService.getSubscriptionInfo] Respuesta del backend:', {
        esArray: Array.isArray(subscriptions),
        cantidad: Array.isArray(subscriptions) ? subscriptions.length : 0,
        datos: subscriptions,
      });

      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        console.log('[userService.getSubscriptionInfo] No se encontraron suscripciones activas.');
        return null;
      }

      const subscription = subscriptions[0];
      console.log('[userService.getSubscriptionInfo] ✅ Suscripción encontrada:', {
        id: subscription.id,
        membership_id: subscription.membership?.id,
        membership_name: subscription.membership?.name,
        status: subscription.status,
        started_at: subscription.started_at,
        ended_at: subscription.ended_at,
      });

      return subscription;
    } catch (error) {
      console.error(
        '[userService.getSubscriptionInfo] ❌ Error al obtener subscripción',
        error
      );
      // Si falla (401, 500, etc.), devolvemos null en vez de romper el render
      return null;
    }
  }
}

export const userService = new UserService();
