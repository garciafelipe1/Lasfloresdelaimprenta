import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { StoreCustomer } from '@medusajs/types';

class AuthService {
  async getUser(): Promise<StoreCustomer | null> {
    // getAuthHeaders devuelve { authorization: 'Bearer ...' } o {}
    const authHeaders = (await cookies.getAuthHeaders()) as {
      authorization?: string;
    };

    // Si no hay token, no estamos logueados
    if (!authHeaders.authorization) {
      return null;
    }

    try {
      const response = await medusa.client.fetch<{ customer: StoreCustomer }>(
        '/store/customers/me',
        {
          method: 'GET',
          headers: authHeaders,
        },
      );

      return response.customer ?? null;
    } catch (error) {
      console.error('[authService.getUser] Error obteniendo usuario:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
