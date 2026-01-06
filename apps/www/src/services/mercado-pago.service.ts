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
    console.log('[Membership Subscribe] ========== INICIO DE SUSCRIPCIÓN ==========');
    console.log('[Membership Subscribe] Parámetros recibidos:');
    console.log('[Membership Subscribe]   - email:', email);
    console.log('[Membership Subscribe]   - userId:', userId);
    console.log('[Membership Subscribe]   - membership:', membership);
    console.log('[Membership Subscribe]   - MEDUSA_BACKEND_URL:', envs.MEDUSA_BACKEND_URL);
    console.log('[Membership Subscribe]   - APP_URL:', envs.APP_URL);

    console.log('[Membership Subscribe] Obteniendo información de la membresía...');
    const membershipResult = await medusa.client.fetch<MembershipType>(
      `/membership/${membership}`,
    );

    if (!membershipResult) {
      console.error('[Membership Subscribe] ❌ Membresía no encontrada:', membership);
      throw new Error('Membership not found');
    }

    console.log('[Membership Subscribe] ✅ Membresía encontrada:');
    console.log('[Membership Subscribe]   - id:', membershipResult.id);
    console.log('[Membership Subscribe]   - name:', membershipResult.name);
    console.log('[Membership Subscribe]   - price:', membershipResult.price);

    const external_reference: ExternalReference = {
      userId,
      membershipId: membershipResult.id,
    };

    console.log('[Membership Subscribe] External reference creado:');
    console.log('[Membership Subscribe]   - userId:', external_reference.userId);
    console.log('[Membership Subscribe]   - membershipId:', external_reference.membershipId);
    console.log('[Membership Subscribe]   - JSON:', JSON.stringify(external_reference));

    // URL del webhook para recibir notificaciones cuando se apruebe la suscripción
    const notificationUrl = `${envs.MEDUSA_BACKEND_URL}/membership/subscription`;
    console.log('[Membership Subscribe] Notification URL:', notificationUrl);
    console.log('[Membership Subscribe] Back URL:', envs.APP_URL);

    const preapprovalBody = {
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
      notification_url: notificationUrl,
    };

    console.log('[Membership Subscribe] Creando PreApproval en MercadoPago...');
    console.log('[Membership Subscribe] Body completo:', JSON.stringify(preapprovalBody, null, 2));

    const subscription = await new PreApproval(mercadoPagoClient).create({
      body: preapprovalBody,
    });

    console.log('[Membership Subscribe] ✅ PreApproval creado en MercadoPago:');
    console.log('[Membership Subscribe]   - id:', subscription.id);
    console.log('[Membership Subscribe]   - status:', subscription.status);
    console.log('[Membership Subscribe]   - init_point:', subscription.init_point);
    console.log('[Membership Subscribe]   - external_reference:', subscription.external_reference);
    console.log('[Membership Subscribe]   - notification_url:', subscription.notification_url);
    console.log('[Membership Subscribe] Response completo:', JSON.stringify(subscription, null, 2));

    if (!subscription || !subscription.init_point) {
      console.error('[Membership Subscribe] ❌ Error: PreApproval no tiene init_point');
      console.error('[Membership Subscribe] Response:', JSON.stringify(subscription, null, 2));
      throw new Error(
        'MercadoPago subscription failed: ' + JSON.stringify(subscription),
      );
    }

    console.log('[Membership Subscribe] ========== FIN DE SUSCRIPCIÓN (ÉXITO) ==========');
    console.log('[Membership Subscribe] Redirigiendo a:', subscription.init_point);

    return subscription.init_point!;
  },
};
