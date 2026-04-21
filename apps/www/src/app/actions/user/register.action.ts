'use server';

import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { actionClient } from '@/lib/safe-action';
import { WELCOME_METADATA } from '@/lib/welcome/metadata-keys';
import { registerSchema } from '@/lib/zod/register-schema';
import { FetchError } from '@medusajs/js-sdk';

function medusaBackendUrl(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ''
  );
}

export const registerAction = actionClient
  .schema(registerSchema)
  .action(async ({ parsedInput: { email, name, password, phone, referralCode } }) => {
    try {
      const token = await medusa.auth.register('customer', 'emailpass', {
        email,
        password,
      });

      await cookies.setAuthToken(token as string);
    } catch (error) {
      const fetchError = error as FetchError;
      if (
        fetchError.statusText !== 'Unauthorized' ||
        fetchError.message !== 'Identity with email already exists'
      ) {
        throw new Error(
          `An error occured while creating account: ${fetchError}`,
        );
      }

      // another identity (for example, admin user)
      // exists with the same email. So, use the auth
      // flow to login and create a customer.
      const loginResponse = await medusa.auth
        .login('customer', 'emailpass', {
          email,
          password,
        })
        .catch((e) => {
          console.error({ e });
          throw new Error(`An error occured while creating account: ${e}`);
        });

      if (!loginResponse) {
        return;
      }

      if (typeof loginResponse !== 'string') {
        throw new Error(
          "Authentication requires more actions, which isn't supported by this flow.",
        );
      }

      await cookies.setAuthToken(loginResponse as string);
    }

    const headers = await cookies.getAuthHeaders();

    try {
      await medusa.store.customer.create(
        {
          email,
          first_name: name,
          last_name: name,
          phone,
          metadata: {
            [WELCOME_METADATA.offerEligible]: true,
          },
        },
        {},
        headers,
      );
    } catch (error) {
      console.error({ error });
      throw new Error(`Error ${error}`);
    }

    const ref = typeof referralCode === 'string' ? referralCode.trim() : '';
    if (ref.length >= 3) {
      const base = medusaBackendUrl();
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';
      if (base) {
        try {
          const attachRes = await fetch(`${base.replace(/\/$/, '')}/store/referral/attach`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...headers,
              ...(publishableKey ? { 'x-publishable-api-key': publishableKey } : {}),
            },
            body: JSON.stringify({ code: ref }),
          });
          if (!attachRes.ok) {
            const body = await attachRes.text();
            console.warn('[register] referral attach failed:', attachRes.status, body);
          }
        } catch (e) {
          console.warn('[register] referral attach:', e);
        }
      }
    }
  });
