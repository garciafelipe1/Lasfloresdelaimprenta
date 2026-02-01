import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { StoreOrder } from '@medusajs/types';

type ListOrdersResponse = {
  orders: StoreOrder[];
  count?: number;
  offset?: number;
  limit?: number;
};

class OrderService {
  async listMyOrders(opts?: { limit?: number; offset?: number }) {
    const authHeaders = await cookies.getAuthHeaders();

    if (!('authorization' in authHeaders)) {
      return { orders: [], count: 0, offset: 0, limit: opts?.limit ?? 20 } satisfies ListOrdersResponse;
    }

    const limit = opts?.limit ?? 20;
    const offset = opts?.offset ?? 0;

    // Medusa store endpoint: lista pedidos del customer autenticado
    const qs = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    return await medusa.client.fetch<ListOrdersResponse>(
      `/store/customers/me/orders?${qs.toString()}`,
      { headers: authHeaders },
    );
  }

  async getMyOrder(orderId: string) {
    const authHeaders = await cookies.getAuthHeaders();

    if (!('authorization' in authHeaders)) {
      return null;
    }

    // Medusa store endpoint: obtiene un pedido (valida ownership por token)
    const res = await medusa.client.fetch<{ order: StoreOrder }>(
      `/store/orders/${orderId}`,
      { headers: authHeaders },
    );

    return res.order ?? null;
  }
}

export const orderService = new OrderService();

