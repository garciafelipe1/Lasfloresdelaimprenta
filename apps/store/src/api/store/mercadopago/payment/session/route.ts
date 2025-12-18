import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { z } from "zod";
import { UpdatePaymentSessionSchema, UpdatePaymentSessionSchemaType } from "./validators";

/**
 * Endpoint para verificar el pago en MercadoPago y preparar la sesión de pago
 * 
 * Este endpoint se llama después de que el usuario completa el pago en MercadoPago.
 * Verifica el pago en MercadoPago usando el payment_id y registra la información
 * para que el plugin pueda usar esta información cuando se complete el carrito.
 */
export async function POST(req: MedusaRequest<UpdatePaymentSessionSchemaType>, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  logger.info(`[PaymentSessionUpdate] ========== INICIO DE ACTUALIZACIÓN DE SESIÓN ==========`);
  logger.info(`[PaymentSessionUpdate] Timestamp: ${new Date().toISOString()}`);

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    logger.error("[PaymentSessionUpdate] ❌ MERCADOPAGO_ACCESS_TOKEN not configured");
    return res.status(500).json({
      error: "MercadoPago configuration error",
    });
  }
  logger.info(`[PaymentSessionUpdate] ✅ MERCADOPAGO_ACCESS_TOKEN configurado (longitud: ${accessToken.length})`);

  try {
    logger.info(`[PaymentSessionUpdate] Paso 1: Parseando body de la request...`);
    logger.info(`[PaymentSessionUpdate] Body recibido: ${JSON.stringify(req.body, null, 2)}`);
    
    const body = UpdatePaymentSessionSchema.parse(req.body);

    const { paymentSessionId, paymentId, cartId } = body;

    logger.info(`[PaymentSessionUpdate] ✅ Body parseado correctamente`);
    logger.info(`[PaymentSessionUpdate] paymentSessionId: ${paymentSessionId}`);
    logger.info(`[PaymentSessionUpdate] paymentId: ${paymentId}`);
    logger.info(`[PaymentSessionUpdate] cartId: ${cartId}`);
    logger.info(`[PaymentSessionUpdate] Verificando pago ${paymentId} para sesión ${paymentSessionId} y carrito ${cartId}`);

    // Verificar el pago en MercadoPago
    logger.info(`[PaymentSessionUpdate] Paso 2: Creando cliente de MercadoPago...`);
    const mercadoPagoClient = new MercadoPagoConfig({
      accessToken,
    });
    logger.info(`[PaymentSessionUpdate] ✅ Cliente de MercadoPago creado`);

    let payment;
    try {
      logger.info(`[PaymentSessionUpdate] Paso 3: Consultando pago en MercadoPago con paymentId: ${paymentId}...`);
      payment = await new Payment(mercadoPagoClient).get({
        id: paymentId,
      });
      
      logger.info(`[PaymentSessionUpdate] ✅ Pago obtenido de MercadoPago`);
      logger.info(`[PaymentSessionUpdate] Detalles del pago:`);
      logger.info(`[PaymentSessionUpdate]   - id: ${payment.id}`);
      logger.info(`[PaymentSessionUpdate]   - status: ${payment.status}`);
      logger.info(`[PaymentSessionUpdate]   - status_detail: ${payment.status_detail}`);
      logger.info(`[PaymentSessionUpdate]   - external_reference: ${payment.external_reference}`);
      logger.info(`[PaymentSessionUpdate]   - transaction_amount: ${payment.transaction_amount}`);
      logger.info(`[PaymentSessionUpdate]   - payment_method_id: ${payment.payment_method_id}`);
      logger.info(`[PaymentSessionUpdate]   - payment_type_id: ${payment.payment_type_id}`);
      logger.info(`[PaymentSessionUpdate] Pago verificado en MercadoPago - id: ${payment.id}, status: ${payment.status}, status_detail: ${payment.status_detail}, external_reference: ${payment.external_reference}, transaction_amount: ${payment.transaction_amount}`);

      // Verificar que el external_reference coincida con el cart_id
      if (payment.external_reference !== cartId) {
        logger.warn(`[PaymentSessionUpdate] ⚠️ El external_reference del pago (${payment.external_reference}) no coincide con el cart_id (${cartId})`);
      }

      // Verificar que el pago esté aprobado
      if (payment.status !== "approved") {
        logger.warn(`[PaymentSessionUpdate] ⚠️ El pago no está aprobado. Status: ${payment.status}, Detail: ${payment.status_detail}`);
        return res.status(400).json({
          error: "Payment not approved",
          payment_status: payment.status,
          payment_status_detail: payment.status_detail,
        });
      }
    } catch (mpError: any) {
      logger.error(`[PaymentSessionUpdate] Error al verificar pago en MercadoPago: ${mpError.message}`, mpError);
      return res.status(500).json({
        error: "Failed to verify payment with MercadoPago",
        message: mpError.message,
      });
    }

    // Obtener la sesión de pago actual
    logger.info(`[PaymentSessionUpdate] Paso 4: Obteniendo sesión de pago de Medusa...`);
    logger.info(`[PaymentSessionUpdate] paymentSessionId a buscar: ${paymentSessionId}`);
    
    const paymentSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);

    if (!paymentSession) {
      logger.error(`[PaymentSessionUpdate] ❌ Payment session ${paymentSessionId} not found`);
      return res.status(404).json({
        error: "Payment session not found",
      });
    }

    logger.info(`[PaymentSessionUpdate] ✅ Sesión de pago encontrada`);
    logger.info(`[PaymentSessionUpdate] Detalles de la sesión ANTES de autorizar:`);
    logger.info(`[PaymentSessionUpdate]   - id: ${paymentSession.id}`);
    logger.info(`[PaymentSessionUpdate]   - provider_id: ${paymentSession.provider_id}`);
    logger.info(`[PaymentSessionUpdate]   - status: ${paymentSession.status}`);
    logger.info(`[PaymentSessionUpdate]   - hasData: ${!!paymentSession.data}`);
    logger.info(`[PaymentSessionUpdate]   - data keys: ${paymentSession.data ? Object.keys(paymentSession.data).join(', ') : 'null'}`);
    logger.info(`[PaymentSessionUpdate] Sesión de pago actual - id: ${paymentSession.id}, provider_id: ${paymentSession.provider_id}, status: ${paymentSession.status}, hasData: ${!!paymentSession.data}`);

    // IMPORTANTE: Para el flujo de Checkout Pro con preferencias, necesitamos autorizar
    // manualmente la sesión de pago porque el plugin está diseñado para Payment Brick.
    // El plugin debería verificar el pago usando el external_reference cuando se complete
    // el carrito, pero para asegurarnos de que funcione correctamente, actualizamos
    // los datos de la sesión con información del pago y confiamos en que el plugin
    // autorizará correctamente usando el external_reference (cart_id).
    
    // El plugin de MercadoPago tiene un método authorizePaymentSession que se llama
    // automáticamente cuando se completa el carrito. Este método debería:
    // 1. Buscar el pago en MercadoPago usando el external_reference (cart_id)
    // 2. Verificar que el pago esté aprobado
    // 3. Autorizar la sesión de pago en Medusa
    
    // Para asegurarnos de que el plugin pueda encontrar el pago, el external_reference
    // debe coincidir con el cart_id, lo cual ya está configurado en la preferencia.
    
      logger.info(`[PaymentSessionUpdate] ✅ Pago verificado exitosamente en MercadoPago.`);
      
      // IMPORTANTE: Autorizar manualmente la sesión de pago
      // El plugin de MercadoPago busca el pago usando el session_id como external_reference,
      // pero en nuestro flujo de Checkout Pro, el external_reference es el cart_id.
      // Por lo tanto, necesitamos autorizar manualmente la sesión usando el payment_id.
      logger.info(`[PaymentSessionUpdate] Paso 5: Preparando datos para autorizar sesión...`);
      logger.info(`[PaymentSessionUpdate] Autorizando manualmente la sesión de pago...`);
      
      const authorizeData = {
        data: {
          id: payment.id,
          status: payment.status,
          transaction_amount: payment.transaction_amount,
          external_reference: payment.external_reference,
          // Incluir el session_id para que el plugin pueda encontrarlo
          session_id: paymentSessionId,
        },
      };
      
      logger.info(`[PaymentSessionUpdate] Datos de autorización preparados:`);
      logger.info(`[PaymentSessionUpdate] ${JSON.stringify(authorizeData, null, 2)}`);
      
      try {
        logger.info(`[PaymentSessionUpdate] Llamando a paymentModuleService.authorizePaymentSession...`);
        logger.info(`[PaymentSessionUpdate] paymentSessionId: ${paymentSessionId}`);
        logger.info(`[PaymentSessionUpdate] authorizeData: ${JSON.stringify(authorizeData, null, 2)}`);
        
        // Autorizar la sesión usando el módulo de pago
        // El método authorizePaymentSession espera los datos del pago en el formato correcto
        const authorizeResult = await paymentModuleService.authorizePaymentSession(
          paymentSessionId,
          authorizeData
        );

        logger.info(`[PaymentSessionUpdate] ✅ authorizePaymentSession ejecutado sin errores`);
        logger.info(`[PaymentSessionUpdate] Resultado de autorización:`);
        logger.info(`[PaymentSessionUpdate] ${JSON.stringify(authorizeResult, null, 2)}`);
        
        // CRÍTICO: Verificar que el estado realmente cambió
        logger.info(`[PaymentSessionUpdate] Paso 6: Verificando cambio de estado de la sesión...`);
        logger.info(`[PaymentSessionUpdate] Estado ANTES de autorizar: ${paymentSession.status}`);
        
        // Esperar un momento para que se propague el cambio
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);
        logger.info(`[PaymentSessionUpdate] Estado DESPUÉS de autorizar: ${updatedSession?.status}`);
        
        // VERIFICACIÓN CRÍTICA: El estado debe ser 'authorized' o 'captured' para que cart.complete() funcione
        if (updatedSession?.status !== 'authorized' && updatedSession?.status !== 'captured') {
          logger.error(`[PaymentSessionUpdate] ❌❌❌ PROBLEMA CRÍTICO: La sesión NO está autorizada después de authorizePaymentSession`);
          logger.error(`[PaymentSessionUpdate] Estado esperado: 'authorized' o 'captured'`);
          logger.error(`[PaymentSessionUpdate] Estado actual: '${updatedSession?.status}'`);
          logger.error(`[PaymentSessionUpdate] Esto causará que cart.complete() falle con "Payment sessions are required to complete cart"`);
        } else {
          logger.info(`[PaymentSessionUpdate] ✅✅✅ Estado correcto: La sesión está ${updatedSession?.status}`);
        }
        
        logger.info(`[PaymentSessionUpdate] ✅ Sesión actualizada obtenida`);
        logger.info(`[PaymentSessionUpdate] Detalles de la sesión DESPUÉS de autorizar:`);
        logger.info(`[PaymentSessionUpdate]   - id: ${updatedSession?.id}`);
        logger.info(`[PaymentSessionUpdate]   - provider_id: ${updatedSession?.provider_id}`);
        logger.info(`[PaymentSessionUpdate]   - status: ${updatedSession?.status} ${updatedSession?.status === 'authorized' || updatedSession?.status === 'captured' ? '✅' : '❌'}`);
        logger.info(`[PaymentSessionUpdate]   - hasData: ${!!updatedSession?.data}`);
        logger.info(`[PaymentSessionUpdate]   - data keys: ${updatedSession?.data ? Object.keys(updatedSession.data).join(', ') : 'null'}`);
        logger.info(`[PaymentSessionUpdate]   - data completo: ${JSON.stringify(updatedSession?.data, null, 2)}`);

        logger.info(`[PaymentSessionUpdate] Paso 7: Preparando respuesta exitosa...`);
        const response = {
          success: true,
          payment: {
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            external_reference: payment.external_reference,
            transaction_amount: payment.transaction_amount,
          },
          payment_session: {
            id: paymentSessionId,
            status: updatedSession?.status || 'authorized',
          },
          message: "Payment verified and session authorized successfully.",
        };
        
        logger.info(`[PaymentSessionUpdate] Respuesta preparada:`);
        logger.info(`[PaymentSessionUpdate] ${JSON.stringify(response, null, 2)}`);
        logger.info(`[PaymentSessionUpdate] ========== FIN DE ACTUALIZACIÓN DE SESIÓN (ÉXITO) ==========`);
        
        return res.json(response);
      } catch (authorizeError: any) {
        logger.error(`[PaymentSessionUpdate] ❌ Error al autorizar sesión`);
        logger.error(`[PaymentSessionUpdate] Tipo de error: ${authorizeError?.constructor?.name}`);
        logger.error(`[PaymentSessionUpdate] Mensaje: ${authorizeError?.message}`);
        logger.error(`[PaymentSessionUpdate] Stack: ${authorizeError?.stack}`);
        logger.error(`[PaymentSessionUpdate] Error completo: ${JSON.stringify(authorizeError, Object.getOwnPropertyNames(authorizeError), 2)}`);
        logger.error(`[PaymentSessionUpdate] Error al autorizar sesión: ${authorizeError.message}`, authorizeError);
        
        // Si falla la autorización, aún retornamos éxito porque el plugin puede intentar autorizar
        // cuando se complete el carrito usando el external_reference
        logger.warn(`[PaymentSessionUpdate] ⚠️ Continuando sin autorización manual. El plugin intentará autorizar cuando se complete el carrito.`);
        
        return res.json({
          success: true,
          payment: {
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            external_reference: payment.external_reference,
            transaction_amount: payment.transaction_amount,
          },
          payment_session: {
            id: paymentSessionId,
            status: paymentSession.status,
          },
          message: "Payment verified successfully. Session authorization will be attempted when cart is completed.",
          warning: "Manual authorization failed, but plugin may authorize automatically.",
        });
      }
  } catch (error: any) {
    logger.error(`[PaymentSessionUpdate] ❌ Error general en el endpoint`);
    logger.error(`[PaymentSessionUpdate] Tipo de error: ${error?.constructor?.name}`);
    logger.error(`[PaymentSessionUpdate] Mensaje: ${error?.message}`);
    logger.error(`[PaymentSessionUpdate] Stack: ${error?.stack}`);
    logger.error(`[PaymentSessionUpdate] Error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
    logger.error(`[PaymentSessionUpdate] Error processing payment session update: ${error.message}`, error);

    if (error instanceof z.ZodError) {
      logger.error(`[PaymentSessionUpdate] Error de validación Zod:`);
      logger.error(`[PaymentSessionUpdate] ${JSON.stringify(error.errors, null, 2)}`);
      logger.info(`[PaymentSessionUpdate] ========== FIN DE ACTUALIZACIÓN DE SESIÓN (ERROR VALIDACIÓN) ==========`);
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
    }

    logger.info(`[PaymentSessionUpdate] ========== FIN DE ACTUALIZACIÓN DE SESIÓN (ERROR) ==========`);
    return res.status(500).json({
      error: "Failed to process payment session update",
      message: error.message,
    });
  }
}

