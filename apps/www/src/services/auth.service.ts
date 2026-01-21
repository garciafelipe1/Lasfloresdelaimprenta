import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { StoreCustomer } from '@medusajs/types';

class AuthService {
  async getUser(retries = 3): Promise<StoreCustomer | null> {
    // getAuthHeaders devuelve { authorization: 'Bearer ...' } o {}
    const authHeaders = (await cookies.getAuthHeaders()) as {
      authorization?: string;
    };

    // Si no hay token, no estamos logueados
    if (!authHeaders.authorization) {
      console.log('[authService.getUser] No hay token en las cookies');
      return null;
    }

    // Log para debugging
    const tokenPreview = authHeaders.authorization.substring(0, 20) + '...';
    console.log(`[authService.getUser] Intentando obtener usuario con token: ${tokenPreview} (intentos restantes: ${retries})`);

    try {
      const response = await medusa.client.fetch<{ customer: StoreCustomer }>(
        '/store/customers/me',
        {
          method: 'GET',
          headers: authHeaders,
        },
      );

      console.log('[authService.getUser] ✅ Usuario obtenido exitosamente');
      return response.customer ?? null;
    } catch (error: any) {
      // Si es un error 401 y tenemos reintentos disponibles, esperar un poco y reintentar
      // Esto ayuda cuando la cookie acaba de establecerse después de un redirect
      if (error?.status === 401 && retries > 0) {
        const waitTime = (4 - retries) * 200; // 200ms, 400ms, 600ms
        console.log(`[authService.getUser] Error 401, reintentando en ${waitTime}ms... (${retries} intentos restantes)`);
        // Esperar progresivamente más tiempo en cada reintento
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.getUser(retries - 1);
      }
      
      console.error('[authService.getUser] Error obteniendo usuario:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
