'use client';

import { medusa } from '@/lib/medusa-client';
import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { decodeToken } from 'react-jwt';

type DecodedToken = {
  actor_id: string;
  actor_type: string;
  auth_identity_id: string;
  app_metadata: Record<string, string>;
  iat: number;
  exp: number;
};

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleOAuth = async () => {
      const params = Object.fromEntries(searchParams.entries());

      try {
        const token = await medusa.auth.callback('customer', 'google', params);
        const decodedToken = decodeToken(token) as DecodedToken;

        const shouldCreateCustomer = decodedToken.actor_id === '';

        if (shouldCreateCustomer) {
          console.log('CREANDO CUSTOMER PORQUE ACTOR_ID ES VACIO');
          const user = await medusa.client.fetch<Record<
            string,
            unknown
          > | null>(`google/${decodedToken.auth_identity_id}`);

          if (!user) {
            console.error('No user found for the provided auth_identity_id');
            throw new Error('No user found for the provided auth_identity_id');
          }

          await medusa.store.customer.create({
            email: user.email as string,
            first_name: (user.given_name as string) ?? '',
            last_name: (user.family_name as string) ?? '',
          });

          const refreshedToken = await medusa.auth.refresh();

          // optionally overwrite token with refreshed version
          Cookies.set('_medusa_jwt', refreshedToken);
        } else {
          Cookies.set('_medusa_jwt', token);
        }

        const { customer } = await medusa.store.customer.retrieve();
        console.log({ customer });

        router.replace('/es/ar/dashboard');
      } catch (err) {
        console.error(err);
        router.replace('/login?error=oauth_failed');
      }
    };

    if (searchParams.size > 0) handleOAuth();
  }, [searchParams, router]);

  return (
    <div className='p-6 text-center'>
      <p className='text-lg font-medium'>Procesando autenticación...</p>
    </div>
  );
}
