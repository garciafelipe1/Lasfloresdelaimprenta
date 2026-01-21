import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { StoreCustomer } from '@medusajs/types';

class AuthService {
  async getUser(retries = 2): Promise<StoreCustomer | null> {
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
    } catch (error: any) {
      // Si es un error 401 y tenemos reintentos disponibles, esperar un poco y reintentar
      // Esto ayuda cuando la cookie acaba de establecerse después de un redirect
      if (error?.status === 401 && retries > 0) {
        console.log(`[authService.getUser] Error 401, reintentando... (${retries} intentos restantes)`);
        // Esperar 100ms antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.getUser(retries - 1);
      }
      
      console.error('[authService.getUser] Error obteniendo usuario:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
