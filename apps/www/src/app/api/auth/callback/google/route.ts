import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { NextRequest, NextResponse } from 'next/server';
import { decodeToken } from 'react-jwt';

type DecodedToken = {
  actor_id: string;
  actor_type: string;
  auth_identity_id: string;
  app_metadata: Record<string, string>;
  iat: number;
  exp: number;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  let token: string;

  try {
    token = await medusa.auth.callback('customer', 'google', params);
    const decodedToken = decodeToken(token) as DecodedToken;
    const shouldCreateCustomer = decodedToken.actor_id === '';

    if (shouldCreateCustomer) {
      await medusa.client.setToken(token);

      console.log('CREANDO CUSTOMER PORQUE ACTOR_ID ES VACIO');
      const user = await medusa.client.fetch<Record<string, unknown> | null>(
        `google/${decodedToken.auth_identity_id}`,
      );

      if (!user) {
        console.error('No user found for the provided auth_identity_id');
        throw new Error('No user found for the provided auth_identity_id');
      }

      await medusa.store.customer.create({
        email: user.email as string,
      });

      await medusa.auth.refresh();
    }

    await medusa.store.customer.retrieve();
  } catch (err) {
    console.error({ err });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=oauth_failed`,
    );
  }

  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/es/ar/dashboard`,
  );

  await cookies.setAuthToken(token);
  return response;
}
