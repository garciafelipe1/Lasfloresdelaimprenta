'use server';

import { actionClient } from '@/lib/safe-action';
import { subscribeSchemaAction } from '@/lib/zod/subscribe-schema';
import { authService } from '@/services/auth.service';
import { mercadoPagoService } from '@/services/mercado-pago.service';
import { redirect } from 'next/navigation';

export const subscribeAction = actionClient
  .schema(subscribeSchemaAction)
  .action(async ({ parsedInput: { email, membership } }) => {
    console.log('[Subscribe Action] ========== INICIO DE ACCIÓN DE SUSCRIPCIÓN ==========');
    console.log('[Subscribe Action] Parámetros recibidos:');
    console.log('[Subscribe Action]   - email:', email);
    console.log('[Subscribe Action]   - membership:', membership);

    let redirectUrl = '';

    try {
      console.log('[Subscribe Action] Obteniendo usuario autenticado...');
      const user = await authService.getUser();

      if (!user) {
        console.error('[Subscribe Action] ❌ Usuario no encontrado');
        throw new Error('User not found');
      }

      console.log('[Subscribe Action] ✅ Usuario encontrado:');
      console.log('[Subscribe Action]   - id:', user.id);
      console.log('[Subscribe Action]   - email:', user.email);

      console.log('[Subscribe Action] Llamando a mercadoPagoService.subscribe...');
      redirectUrl = await mercadoPagoService.subscribe({
        userId: user.id,
        email: email,
        membership,
      });

      console.log('[Subscribe Action] ✅ URL de redirección obtenida:', redirectUrl);
    } catch (error: any) {
      console.error('[Subscribe Action] ❌ ERROR EN EL MP SERVICE');
      console.error('[Subscribe Action] Error message:', error?.message);
      console.error('[Subscribe Action] Error stack:', error?.stack);
      console.error('[Subscribe Action] Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw error; // Re-lanzar el error para que next-safe-action lo maneje
    }

    console.log('[Subscribe Action] Redirigiendo a MercadoPago...');
    console.log('[Subscribe Action] ========== FIN DE ACCIÓN DE SUSCRIPCIÓN ==========');
    redirect(redirectUrl);
  });
