'use server';

import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { actionClient } from '@/lib/safe-action';
import { updateUserSchema } from '@/lib/zod/update-user-schema';
import { revalidatePath } from 'next/cache';
import medusaError from '../helpers/medusa-error';

export const updateUserAction = actionClient
  .schema(updateUserSchema)
  .action(async ({ parsedInput: { name } }) => {
    const headers = await cookies.getAuthHeaders();

    await medusa.store.customer
      .update(
        {
          last_name: name,
        },
        {},
        headers,
      )
      .then(({ customer }) => customer)
      .catch(medusaError);

    revalidatePath('/dashboard/settings/account', 'layout');
  });
