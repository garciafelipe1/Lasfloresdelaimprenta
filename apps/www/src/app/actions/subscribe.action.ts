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
    console.log('[Subscribe Action] Timestamp:', new Date().toISOString());
    console.log('[Subscribe Action] Parámetros recibidos:');
    console.log('[Subscribe Action]   - email:', email);
    console.log('[Subscribe Action]   - membership:', membership);

    let redirectUrl = '';

    try {
      console.log('[Subscribe Action] Paso 1: Obteniendo usuario autenticado...');
      const user = await authService.getUser();

      if (!user) {
        console.error('[Subscribe Action] ❌ Usuario no encontrado');
        throw new Error('Debes iniciar sesión para suscribirte a una membresía');
      }

      console.log('[Subscribe Action] ✅ Usuario encontrado:');
      console.log('[Subscribe Action]   - id:', user.id);
      console.log('[Subscribe Action]   - email:', user.email);

      console.log('[Subscribe Action] Paso 2: Verificando variables de entorno...');
      console.log('[Subscribe Action]   - process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL:', process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '(no definida)');
      console.log('[Subscribe Action]   - process.env.APP_URL:', process.env.APP_URL || '(no definida)');

      console.log('[Subscribe Action] Paso 3: Llamando a mercadoPagoService.subscribe...');
      console.log('[Subscribe Action]   - userId:', user.id);
      console.log('[Subscribe Action]   - email:', email);
      console.log('[Subscribe Action]   - membership:', membership);
      
      redirectUrl = await mercadoPagoService.subscribe({
        userId: user.id,
        email: email,
        membership,
      });

      console.log('[Subscribe Action] ✅ URL de redirección obtenida exitosamente:');
      console.log('[Subscribe Action]   - redirectUrl:', redirectUrl);
      console.log('[Subscribe Action]   - redirectUrl length:', redirectUrl?.length || 0);
      console.log('[Subscribe Action]   - redirectUrl type:', typeof redirectUrl);

      if (!redirectUrl || redirectUrl.trim() === '') {
        console.error('[Subscribe Action] ❌ ERROR: URL de redirección está vacía');
        throw new Error('No se pudo obtener la URL de pago de MercadoPago. Por favor, intenta nuevamente.');
      }

      console.log('[Subscribe Action] Paso 4: Validando formato de URL...');
      try {
        new URL(redirectUrl);
        console.log('[Subscribe Action] ✅ URL válida');
      } catch (urlError: any) {
        console.error('[Subscribe Action] ❌ ERROR: URL inválida:', urlError.message);
        throw new Error('La URL de pago de MercadoPago es inválida. Por favor, contacta al soporte.');
      }

      console.log('[Subscribe Action] Paso 5: Redirigiendo a MercadoPago...');
      console.log('[Subscribe Action] ========== FIN DE ACCIÓN DE SUSCRIPCIÓN (ÉXITO) ==========');
      
      // Usar redirect de Next.js para redirigir al usuario
      redirect(redirectUrl);
    } catch (error: any) {
      console.error('[Subscribe Action] ========== ERROR EN SUSCRIPCIÓN ==========');
      console.error('[Subscribe Action] Timestamp:', new Date().toISOString());
      console.error('[Subscribe Action] Tipo de error:', error?.constructor?.name || typeof error);
      console.error('[Subscribe Action] Error message:', error?.message);
      console.error('[Subscribe Action] Error stack:', error?.stack);
      
      // Log detallado del error si es un error de MercadoPago
      if (error?.response?.data) {
        console.error('[Subscribe Action] Error response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      if (error?.cause) {
        console.error('[Subscribe Action] Error cause:', error.cause);
      }
      
      console.error('[Subscribe Action] Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('[Subscribe Action] ========== FIN DE ERROR ==========');
      
      // Crear un mensaje de error más descriptivo para el usuario
      let userMessage = 'No se pudo iniciar la suscripción. Por favor, intenta nuevamente.';
      
      if (error?.message) {
        userMessage = error.message;
      } else if (error?.response?.data?.message) {
        userMessage = `Error de MercadoPago: ${error.response.data.message}`;
      } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
        userMessage = 'No se pudo conectar con MercadoPago. Verifica tu conexión a internet e intenta nuevamente.';
      }
      
      // Re-lanzar el error con el mensaje mejorado para que next-safe-action lo maneje
      throw new Error(userMessage);
    }
  });
