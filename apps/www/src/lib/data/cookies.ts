/* eslint-disable @typescript-eslint/no-empty-object-type */
import { cookies as nextCookies } from 'next/headers';

export const cookies = {
  async getCartId() {
    const cookies = await nextCookies();
    return cookies.get('_medusa_cart_id')?.value;
  },

  async setCartId(cartId: string) {
    const cookies = await nextCookies();
    cookies.set('_medusa_cart_id', cartId, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
  },

  async removeCartId() {
    const cookies = await nextCookies();
    cookies.set('_medusa_cart_id', '', {
      maxAge: -1,
    });
  },

  async setAuthToken(token: string) {
    const cookies = await nextCookies();
    const isProduction = process.env.NODE_ENV === 'production';
    cookies.set('_medusa_jwt', token, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: isProduction ? 'lax' : 'strict', // "lax" permite cookies en redirects cross-site
      secure: isProduction,
      path: '/',
    });
  },

  async getAuthToken() {
    const cookies = await nextCookies();
    const token = cookies.get('_medusa_jwt')?.value;
    return token;
  },

  async removeAuthToken() {
    const cookies = await nextCookies();
    cookies.set('_medusa_jwt', '', {
      maxAge: -1,
    });
  },

  async getAuthHeaders(): Promise<{ authorization: string } | {}> {
    const cookieStore = await nextCookies();
    const token = cookieStore.get('_medusa_jwt')?.value;

    if (!token) {
      console.log('[cookies.getAuthHeaders] No se encontró token _medusa_jwt en las cookies del servidor');
      // Listar todas las cookies disponibles para debugging
      const allCookies = cookieStore.getAll();
      console.log('[cookies.getAuthHeaders] Cookies disponibles:', allCookies.map(c => c.name));
      return {};
    }

    console.log(`[cookies.getAuthHeaders] Token encontrado: ${token.substring(0, 20)}... (longitud: ${token.length})`);
    return { authorization: `Bearer ${token}` };
  },
};
