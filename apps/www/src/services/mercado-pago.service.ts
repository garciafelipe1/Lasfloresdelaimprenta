import envs from '@/config/envs';
import { medusa } from '@/lib/medusa-client';
import { mercadoPagoClient } from '@/lib/mp-client';
import { MembershipType } from '@server/types';
import { PreApproval } from 'mercadopago';
import { z } from 'zod';

interface SubscribeOptions {
  membership: string;
  email: string;
  userId: string;
}

export const externalReferenceSchema = z.object({
  userId: z.string(),
  membershipId: z.string(),
});

export type ExternalReference = z.infer<typeof externalReferenceSchema>;

export const mercadoPagoService = {
  async subscribe({
    email,
    userId,
    membership,
  }: SubscribeOptions): Promise<string> {
    const membershipResult = await medusa.client.fetch<MembershipType>(
      `/membership/${membership}`,
    );

    if (!membershipResult) {
      throw new Error('Membership not found');
    }

    const external_reference: ExternalReference = {
      userId,
      membershipId: membershipResult.id,
    };

    // URL del webhook para recibir notificaciones cuando se apruebe la suscripción
    const notificationUrl = `${envs.MEDUSA_BACKEND_URL}/membership/subscription`;
    console.log('[Membership Subscribe] Notification URL:', notificationUrl);

    const subscription = await new PreApproval(mercadoPagoClient).create({
      body: {
        back_url: envs.APP_URL,
        reason: `Suscripción - La Florería De La Imprenta - ${membershipResult.name}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: membershipResult.price,
          currency_id: 'ARS',
        },
        payer_email: email,
        status: 'pending',
        external_reference: JSON.stringify(external_reference),
        notification_url: notificationUrl, // CRÍTICO: URL para recibir webhooks de MercadoPago
      },
    });

    console.log('SUBSCRIPTION RESPONSE', subscription);

    if (!subscription || !subscription.init_point) {
      throw new Error(
        'MercadoPago subscription failed: ' + JSON.stringify(subscription),
      );
    }

    return subscription.init_point!;
  },
};
