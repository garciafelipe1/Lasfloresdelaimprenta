import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { StoreCustomer } from '@medusajs/types';

// Un intento inicial + un reintento (para dar tiempo al backend tras OAuth). Evita muchas peticiones 401 con token inválido.
const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 500;

export type GetUserResult = { user: StoreCustomer | null; clearedInvalidToken?: boolean };

class AuthService {
  /**
   * Obtiene el usuario actual. Si el token existe pero Medusa devuelve 401 tras los reintentos,
   * se borra la cookie aquí mismo y se devuelve clearedInvalidToken para que el layout redirija al login.
   */
  async getUserResult(retries = DEFAULT_RETRIES): Promise<GetUserResult> {
    try {
      const publishableKey =
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';

      const authHeaders = (await cookies.getAuthHeaders()) as {
        authorization?: string;
      };

      if (!authHeaders.authorization) {
        return { user: null };
      }

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

        return { user: response.customer ?? null };
      } catch (error: unknown) {
        const status =
          (error as { status?: number; statusCode?: number })?.status ??
          (error as { statusCode?: number })?.statusCode;

        if (status === 401 && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          return this.getUserResult(retries - 1);
        }

        if (status === 401 && retries === 0) {
          await cookies.removeAuthToken();
          return { user: null, clearedInvalidToken: true };
        }

        return { user: null };
      }
    } catch {
      return { user: null };
    }
  }

  async getUser(retries = DEFAULT_RETRIES): Promise<StoreCustomer | null> {
    try {
      const { user } = await this.getUserResult(retries);
      return user;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
