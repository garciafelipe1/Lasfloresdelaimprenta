'use server';

import { actionClient } from '@/lib/safe-action';
import { subscribeSchemaAction } from '@/lib/zod/subscribe-schema';
import { authService } from '@/services/auth.service';
import { mercadoPagoService } from '@/services/mercado-pago.service';
import { redirect } from 'next/navigation';

export const subscribeAction = actionClient
  .schema(subscribeSchemaAction)
  .action(async ({ parsedInput: { email, membership } }) => {
    let redirectUrl = '';

    try {
      const user = await authService.getUser();

      if (!user) {
        throw new Error('User not found');
      }

      redirectUrl = await mercadoPagoService.subscribe({
        userId: user.id,
        email: email,
        membership,
      });
    } catch (error) {
      console.log("EXPLOTO EN EL MP SERVICE");
      console.log({ error });
    }

    redirect(redirectUrl);
  });
