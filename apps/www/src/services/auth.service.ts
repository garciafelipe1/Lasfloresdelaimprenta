import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { StoreCustomer } from '@medusajs/types';

const DEFAULT_RETRIES = 4;
// Delays en ms para cada reintento (tras 401): da tiempo al backend a vincular customer tras OAuth
const RETRY_DELAYS_MS = [400, 800, 1200];

export type GetUserResult = { user: StoreCustomer | null; clearedInvalidToken?: boolean };

class AuthService {
  /**
   * Obtiene el usuario actual. Si el token existe pero devuelve 401 tras todos los reintentos,
   * se borra la cookie (clearedInvalidToken) para evitar bucle login → Google → 401 → login.
   */
  async getUserResult(retries = DEFAULT_RETRIES): Promise<GetUserResult> {
    const authHeaders = (await cookies.getAuthHeaders()) as {
      authorization?: string;
    };

    if (!authHeaders.authorization) {
      console.log('[authService.getUser] No hay token en las cookies');
      return { user: null };
    }

    const tokenPreview = authHeaders.authorization.substring(0, 20) + '...';
    console.log(`[authService.getUser] Intentando obtener usuario con token: ${tokenPreview} (intentos restantes: ${retries})`);

    const publishableKey =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';
    const headers: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      ...(publishableKey ? { 'x-publishable-api-key': publishableKey } : {}),
    };

    try {
      const response = await medusa.client.fetch<{ customer: StoreCustomer }>(
        '/store/customers/me',
        {
          method: 'GET',
          headers,
        },
      );

      console.log('[authService.getUser] ✅ Usuario obtenido exitosamente');
      return { user: response.customer ?? null };
    } catch (error: any) {
      if (error?.status === 401 && retries > 0) {
        const delayIndex = DEFAULT_RETRIES - retries;
        const waitTime = RETRY_DELAYS_MS[delayIndex] ?? 600;
        console.log(`[authService.getUser] Error 401, reintentando en ${waitTime}ms... (${retries} intentos restantes)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.getUserResult(retries - 1);
      }

      if (error?.status === 401 && retries === 0) {
        console.log('[authService.getUser] Token inválido (401 tras reintentos). No se puede borrar la cookie aquí (solo en Route Handler o Server Action).');
        return { user: null, clearedInvalidToken: true };
      }

      // Si es otro tipo de error (no 401), no limpiamos la cookie porque podría ser un problema temporal
      if (error?.status !== 401) {
        console.error('[authService.getUser] Error obteniendo usuario (no es 401):', error?.status, error?.message);
      }

      console.error('[authService.getUser] Error obteniendo usuario:', error);
      return { user: null };
    }
  }

  async getUser(retries = DEFAULT_RETRIES): Promise<StoreCustomer | null> {
    const { user } = await this.getUserResult(retries);
    return user;
  }
}

export const authService = new AuthService();
