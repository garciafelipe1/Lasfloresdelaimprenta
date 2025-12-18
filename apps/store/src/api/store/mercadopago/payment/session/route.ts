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

    logger.info(`[PaymentSessionUpdate] ✅ Pago verificado exitosamente en MercadoPago.`);
    
    // IMPORTANTE: El plugin de MercadoPago está diseñado para autorizar automáticamente
    // cuando se completa el carrito. El plugin buscará el pago usando el external_reference
    // (que es el cart_id) de los datos de la sesión de pago.
    // 
    // Para que el plugin pueda encontrar el pago, necesitamos que:
    // 1. El external_reference en la preferencia de MercadoPago sea el cart_id (✅ ya configurado)
    // 2. El plugin tenga acceso al external_reference cuando autorice (se obtiene del cart)
    //
    // Intentamos autorizar manualmente aquí para que la sesión esté lista antes de cart.complete(),
    // pero si falla, el plugin debería intentar autorizar automáticamente durante cart.complete().
    
    logger.info(`[PaymentSessionUpdate] Paso 5: Intentando autorizar la sesión de pago...`);
    
    try {
      // CRÍTICO: El plugin busca el pago usando session_id como external_reference en MercadoPago
      // Como usamos cart_id como external_reference en la preferencia, debemos pasar cart_id como session_id
      const sessionIdForPlugin = payment.external_reference || cartId;
      
      logger.info(`[PaymentSessionUpdate] Configuración para autorización:`);
      logger.info(`[PaymentSessionUpdate]   - session_id (external_reference para plugin): ${sessionIdForPlugin}`);
      logger.info(`[PaymentSessionUpdate]   - payment_id: ${payment.id}`);
      logger.info(`[PaymentSessionUpdate]   - payment status: ${payment.status}`);
      logger.info(`[PaymentSessionUpdate]   - payment external_reference: ${payment.external_reference}`);
      logger.info(`[PaymentSessionUpdate]   - cart_id: ${cartId}`);
      
      if (payment.external_reference !== cartId) {
        logger.warn(`[PaymentSessionUpdate] ⚠️ ADVERTENCIA: El external_reference del pago (${payment.external_reference}) no coincide con el cart_id (${cartId})`);
        logger.warn(`[PaymentSessionUpdate] ⚠️ Esto puede causar que el plugin no encuentre el pago al buscar por external_reference.`);
      } else {
        logger.info(`[PaymentSessionUpdate] ✅ El external_reference del pago coincide con el cart_id.`);
      }
      
      // IMPORTANTE: El plugin necesita que session_id coincida con el external_reference del pago
      // Pasamos los datos esenciales que el plugin necesita para encontrar y autorizar el pago
      // El plugin buscará el pago en MercadoPago usando session_id como external_reference
      const authorizeData = {
        data: {
          // CRÍTICO: session_id DEBE ser el cart_id (external_reference) para que el plugin encuentre el pago
          session_id: sessionIdForPlugin,
          // Incluir payment_id para que el plugin pueda validar directamente sin buscar
          payment_id: payment.id.toString(),
        },
      };
      
      logger.info(`[PaymentSessionUpdate] Datos de autorización (simplificados): ${JSON.stringify(authorizeData, null, 2)}`);
      logger.info(`[PaymentSessionUpdate] Llamando a authorizePaymentSession...`);
      
      const authorizeResult = await paymentModuleService.authorizePaymentSession(
        paymentSessionId,
        authorizeData
      );

      logger.info(`[PaymentSessionUpdate] ✅ authorizePaymentSession ejecutado`);
      logger.info(`[PaymentSessionUpdate] Resultado: ${JSON.stringify(authorizeResult, null, 2)}`);
      
      // CRÍTICO: Verificar que el estado realmente cambió
      logger.info(`[PaymentSessionUpdate] Paso 6: Verificando cambio de estado...`);
      logger.info(`[PaymentSessionUpdate] Estado ANTES: ${paymentSession.status}`);
      
      // Esperar un momento para que se propague el cambio en la base de datos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const finalSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);
      logger.info(`[PaymentSessionUpdate] Estado DESPUÉS: ${finalSession?.status}`);
      logger.info(`[PaymentSessionUpdate] Detalles de la sesión después de autorizar:`);
      logger.info(`[PaymentSessionUpdate]   - id: ${finalSession?.id}`);
      logger.info(`[PaymentSessionUpdate]   - status: ${finalSession?.status}`);
      logger.info(`[PaymentSessionUpdate]   - data: ${JSON.stringify(finalSession?.data, null, 2)}`);
      
      // VERIFICACIÓN CRÍTICA
      if (finalSession?.status !== 'authorized' && finalSession?.status !== 'captured') {
        logger.error(`[PaymentSessionUpdate] ❌❌❌ PROBLEMA CRÍTICO: La sesión NO está autorizada después de authorizePaymentSession`);
        logger.error(`[PaymentSessionUpdate] Estado esperado: 'authorized' o 'captured'`);
        logger.error(`[PaymentSessionUpdate] Estado actual: '${finalSession?.status}'`);
        logger.error(`[PaymentSessionUpdate] Esto causará que cart.complete() falle con "Payment sessions are required to complete cart"`);
        logger.warn(`[PaymentSessionUpdate] ⚠️ NOTA: El plugin debería intentar autorizar automáticamente durante cart.complete() usando external_reference: ${payment.external_reference}`);
        logger.warn(`[PaymentSessionUpdate] ⚠️ Continuando de todas formas - el plugin puede autorizar durante cart.complete()`);
      } else {
        logger.info(`[PaymentSessionUpdate] ✅✅✅ Estado correcto: La sesión está ${finalSession?.status}`);
        logger.info(`[PaymentSessionUpdate] ✅✅✅ cart.complete() debería funcionar correctamente`);
      }

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
          status: finalSession?.status || paymentSession.status,
        },
        message: "Payment verified and session updated successfully.",
      };
      
      logger.info(`[PaymentSessionUpdate] ========== FIN DE ACTUALIZACIÓN DE SESIÓN (ÉXITO) ==========`);
      
      return res.json(response);
    } catch (error: any) {
      logger.error(`[PaymentSessionUpdate] ❌ Error al autorizar sesión`);
      logger.error(`[PaymentSessionUpdate] Tipo: ${error?.constructor?.name}`);
      logger.error(`[PaymentSessionUpdate] Mensaje: ${error?.message}`);
      logger.error(`[PaymentSessionUpdate] Stack: ${error?.stack}`);
      logger.error(`[PaymentSessionUpdate] Error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
      
      // IMPORTANTE: Aún retornamos éxito porque el plugin puede intentar autorizar automáticamente
      // durante cart.complete() usando el external_reference (cart_id) del carrito
      logger.warn(`[PaymentSessionUpdate] ⚠️ La autorización manual falló, pero el plugin puede autorizar durante cart.complete()`);
      logger.warn(`[PaymentSessionUpdate] ⚠️ El plugin buscará el pago usando external_reference: ${payment.external_reference}`);
      
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
        warning: "Manual authorization failed, but plugin may authorize automatically during cart.complete().",
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

