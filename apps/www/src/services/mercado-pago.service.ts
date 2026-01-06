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
    
    // Log detallado de todas las variables de entorno relacionadas
    console.log('[Membership Subscribe] 🔍 DIAGNÓSTICO DE VARIABLES DE ENTORNO:');
    console.log('[Membership Subscribe]   - process.env.MEDUSA_BACKEND_URL:', process.env.MEDUSA_BACKEND_URL || '(no definida)');
    console.log('[Membership Subscribe]   - process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL:', process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '(no definida)');
    console.log('[Membership Subscribe]   - process.env.NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL || '(no definida)');
    console.log('[Membership Subscribe]   - process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || '(no definida)');
    console.log('[Membership Subscribe]   - envs.MEDUSA_BACKEND_URL (resuelto):', envs.MEDUSA_BACKEND_URL || '(vacío)');
    console.log('[Membership Subscribe]   - envs.APP_URL:', envs.APP_URL || '(vacío)');

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

    // Validar que MEDUSA_BACKEND_URL esté definido y no esté vacío
    const medusaBackendUrl = envs.MEDUSA_BACKEND_URL?.trim();
    if (!medusaBackendUrl || medusaBackendUrl === '') {
      console.error('[Membership Subscribe] ❌ ERROR: MEDUSA_BACKEND_URL no está definido o está vacío');
      console.error('[Membership Subscribe] Variables de entorno disponibles (raw):', {
        MEDUSA_BACKEND_URL: process.env.MEDUSA_BACKEND_URL || '(no definida)',
        NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '(no definida)',
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || '(no definida)',
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '(no definida)',
      });
      console.error('[Membership Subscribe] envs.MEDUSA_BACKEND_URL (resuelto):', envs.MEDUSA_BACKEND_URL || '(vacío)');
      console.error('[Membership Subscribe] Longitud de envs.MEDUSA_BACKEND_URL:', envs.MEDUSA_BACKEND_URL?.length || 0);
      throw new Error('MEDUSA_BACKEND_URL no está configurado. Verifica que NEXT_PUBLIC_MEDUSA_BACKEND_URL tenga un valor válido en Railway.');
    }

    // Validar que APP_URL esté definido
    if (!envs.APP_URL || envs.APP_URL.trim() === '') {
      console.error('[Membership Subscribe] ❌ ERROR: APP_URL no está definido');
      throw new Error('APP_URL no está configurado. No se puede crear la suscripción sin la URL de retorno.');
    }

    // URL del webhook para recibir notificaciones cuando se apruebe la suscripción
    // Asegurar que la URL base no termine con / y no tenga espacios
    const baseUrl = medusaBackendUrl.replace(/\/$/, '').trim();
    const notificationUrl = `${baseUrl}/membership/subscription`;
    
    console.log('[Membership Subscribe] ✅ URL del webhook construida correctamente:');
    console.log('[Membership Subscribe]   - Base URL:', baseUrl);
    console.log('[Membership Subscribe]   - Notification URL:', notificationUrl);
    console.log('[Membership Subscribe] Notification URL:', notificationUrl);
    
    // Construir la URL de éxito para suscripciones
    const successUrl = `${envs.APP_URL}/es/ar/membership/success`;
    console.log('[Membership Subscribe] Back URL (success):', successUrl);

    const preapprovalBody = {
      back_url: successUrl,
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

    let subscription;
    try {
      subscription = await new PreApproval(mercadoPagoClient).create({
        body: preapprovalBody,
      });
      console.log('[Membership Subscribe] ✅ Respuesta de MercadoPago recibida');
    } catch (mpError: any) {
      console.error('[Membership Subscribe] ❌ ERROR AL CREAR PREAPPROVAL EN MERCADOPAGO:');
      console.error('[Membership Subscribe]   - Tipo:', mpError?.constructor?.name || typeof mpError);
      console.error('[Membership Subscribe]   - Mensaje:', mpError?.message);
      console.error('[Membership Subscribe]   - Status:', mpError?.status);
      console.error('[Membership Subscribe]   - Status Code:', mpError?.statusCode);
      
      if (mpError?.response) {
        console.error('[Membership Subscribe]   - Response status:', mpError.response.status);
        console.error('[Membership Subscribe]   - Response data:', JSON.stringify(mpError.response.data, null, 2));
      }
      
      if (mpError?.cause) {
        console.error('[Membership Subscribe]   - Cause:', mpError.cause);
      }
      
      console.error('[Membership Subscribe]   - Stack:', mpError?.stack);
      console.error('[Membership Subscribe]   - Error completo:', JSON.stringify(mpError, Object.getOwnPropertyNames(mpError), 2));
      
      // Crear un mensaje de error más descriptivo
      let errorMessage = 'No se pudo crear la suscripción en MercadoPago';
      if (mpError?.response?.data?.message) {
        errorMessage = `MercadoPago: ${mpError.response.data.message}`;
      } else if (mpError?.message) {
        errorMessage = `Error: ${mpError.message}`;
      }
      
      throw new Error(errorMessage);
    }

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
