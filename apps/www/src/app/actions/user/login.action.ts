'use server';

import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { actionClient } from '@/lib/safe-action';
import { loginSchema } from '@/lib/zod/login-schema';
import { FetchError } from '@medusajs/js-sdk';
import { redirect } from 'next/navigation';

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    try {
      const loginToken = await medusa.auth.login('customer', 'emailpass', {
        email,
        password,
      });

      await cookies.setAuthToken(loginToken as string);
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
    }
    redirect('/dashboard');
  });
