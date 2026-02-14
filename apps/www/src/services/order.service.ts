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

  /**
   * Busca un pedido del usuario actual por display_id (ej. el número en la URL /order/5/confirmed).
   * - Si no hay sesión: devuelve { order: null, validated: false } (no se puede validar).
   * - Si hay sesión y el pedido existe y es del usuario: { order, validated: true }.
   * - Si hay sesión y no se encuentra: { order: null, validated: true } → mostrar "no encontrado".
   */
  async getMyOrderByDisplayId(displayId: string): Promise<{
    order: StoreOrder | null;
    validated: boolean;
  }> {
    const authHeaders = await cookies.getAuthHeaders();

    if (!('authorization' in authHeaders)) {
      return { order: null, validated: false };
    }

    const { orders } = await this.listMyOrders({ limit: 50 });
    const order = orders.find((o) => String(o.display_id) === String(displayId));
    return { order: order ?? null, validated: true };
  }
}

export const orderService = new OrderService();

