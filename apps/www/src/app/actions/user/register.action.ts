'use server';

import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { actionClient } from '@/lib/safe-action';
import { registerSchema } from '@/lib/zod/register-schema';
import { FetchError } from '@medusajs/js-sdk';

export const registerAction = actionClient
  .schema(registerSchema)
  .action(async ({ parsedInput: { email, name, password, phone } }) => {
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
        },
        {},
        headers,
      );
    } catch (error) {
      console.error({ error });
      throw new Error(`Error ${error}`);
    }
  });
