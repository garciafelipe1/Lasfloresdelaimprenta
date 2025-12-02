/* eslint-disable @typescript-eslint/no-empty-object-type */
import { cookies as nextCookies } from 'next/headers';

export const cookies = {
  async getCartId() {
    const cookieStore = await nextCookies();
    return cookieStore.get('_medusa_cart_id')?.value;
  },

  async setCartId(cartId: string) {
    const cookieStore = await nextCookies();
    cookieStore.set('_medusa_cart_id', cartId, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/', // mejor siempre
    });
  },

  async removeCartId() {
    const cookieStore = await nextCookies();
    cookieStore.set('_medusa_cart_id', '', {
      maxAge: -1,
      path: '/',
    });
  },

  async setAuthToken(token: string) {
    const cookieStore = await nextCookies();
    cookieStore.set('_medusa_jwt', token, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  },

  async getAuthToken() {
    const cookieStore = await nextCookies();
    const token = cookieStore.get('_medusa_jwt')?.value;
    return token;
  },

  async removeAuthToken() {
    const cookieStore = await nextCookies();
    cookieStore.set('_medusa_jwt', '', {
      maxAge: -1,
      path: '/',
    });
  },

  async getAuthHeaders(): Promise<{
    authorization?: string;
    'x-publishable-api-key'?: string;
  }> {
    const cookieStore = await nextCookies();
    const token = cookieStore.get('_medusa_jwt')?.value;

    const headers: {
      authorization?: string;
      'x-publishable-api-key'?: string;
    } = {};

    // siempre mandamos la publishable key
    if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
      headers['x-publishable-api-key'] =
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    }

    // si hay JWT, agregamos Authorization
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    return headers;
  },
};
