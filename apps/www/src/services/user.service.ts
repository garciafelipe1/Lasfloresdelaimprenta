import type {
  InnerCircleInfo,
  SubscriptionDashboardInfo,
  SubscriptionMeApiPayload,
  SubscriptionWithMembership,
} from '@/common/dto/subscription.dto';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';

function normalizeSubscriptionPayload(
  raw: SubscriptionMeApiPayload | SubscriptionWithMembership[] | null | undefined,
): SubscriptionDashboardInfo {
  if (!raw) {
    return { subscription: null, innerCircle: null, referral: null };
  }
  if (Array.isArray(raw)) {
    return {
      subscription: raw[0] ?? null,
      innerCircle: null,
      referral: null,
    };
  }
  return {
    subscription: raw.subscriptions?.[0] ?? null,
    innerCircle: raw.innerCircle ?? null,
    referral: raw.referral ?? null,
  };
}

class UserService {
  async getSubscriptionInfo(): Promise<SubscriptionDashboardInfo> {
    const authHeaders = await cookies.getAuthHeaders();

    if (!('authorization' in authHeaders)) {
      return { subscription: null, innerCircle: null, referral: null };
    }

    try {
      const raw = await medusa.client.fetch<
        SubscriptionMeApiPayload | SubscriptionWithMembership[]
      >('/membership/subscription/me', {
        headers: authHeaders,
      });

      return normalizeSubscriptionPayload(raw);
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status ?? (error as { statusCode?: number })?.statusCode;
      if (status === 401) {
        return { subscription: null, innerCircle: null, referral: null };
      }
      return { subscription: null, innerCircle: null, referral: null };
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
