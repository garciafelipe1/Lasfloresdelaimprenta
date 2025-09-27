import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { StoreCustomer } from '@medusajs/types';

class AuthService {
  async getUser(): Promise<StoreCustomer | null> {
    const authHeaders = await cookies.getAuthHeaders();

    if (!authHeaders) return null;

    const headers = {
      ...authHeaders,
    };

    console.log({ headers });

    // const next = {
    //   ...(await getCacheOptions("customers")),
    // }

    try {
      const response = await medusa.client.fetch<{ customer: StoreCustomer }>(
        `/store/customers/me`,
        {
          method: 'GET',
          headers,
        },
      );
      return response.customer;
    } catch (error) {
      console.error({ error });
      return null;
    }
  }
}

export const authService = new AuthService();
