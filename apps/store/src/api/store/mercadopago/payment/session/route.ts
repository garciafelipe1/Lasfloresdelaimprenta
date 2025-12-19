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
    // cuando se completa el carrito usando cart.complete(). El plugin buscará el pago
    // en MercadoPago usando el external_reference (que es el cart_id) del carrito.
    // 
    // Para que el plugin funcione correctamente:
    // 1. El external_reference en la preferencia de MercadoPago debe ser el cart_id (✅ configurado)
    // 2. El plugin obtendrá el cart_id del carrito cuando se llame a cart.complete()
    // 3. El plugin buscará el pago en MercadoPago usando el cart_id como external_reference
    // 4. Si encuentra un pago aprobado, autorizará automáticamente la sesión
    //
    // Por lo tanto, NO necesitamos autorizar manualmente aquí. Solo verificamos el pago
    // y almacenamos el payment_id en los datos de la sesión para referencia, pero confiamos
    // en que el plugin autorizará automáticamente durante cart.complete().
    
    logger.info(`[PaymentSessionUpdate] Paso 5: Verificando configuración para autorización automática...`);
    logger.info(`[PaymentSessionUpdate]   - payment.external_reference (debe ser cart_id): ${payment.external_reference}`);
    logger.info(`[PaymentSessionUpdate]   - cartId: ${cartId}`);
    logger.info(`[PaymentSessionUpdate]   - payment_id: ${payment.id}`);
    logger.info(`[PaymentSessionUpdate]   - payment.status: ${payment.status}`);
    
    if (payment.external_reference !== cartId) {
      logger.error(`[PaymentSessionUpdate] ❌❌❌ ERROR CRÍTICO: El external_reference del pago NO coincide con el cart_id`);
      logger.error(`[PaymentSessionUpdate]   - external_reference: ${payment.external_reference}`);
      logger.error(`[PaymentSessionUpdate]   - cart_id: ${cartId}`);
      logger.error(`[PaymentSessionUpdate] El plugin NO podrá encontrar el pago durante cart.complete() porque buscará por external_reference=${cartId}`);
      logger.error(`[PaymentSessionUpdate] PERO el pago tiene external_reference=${payment.external_reference}`);
      return res.status(400).json({
        error: "Payment external_reference mismatch",
        message: `El external_reference del pago (${payment.external_reference}) no coincide con el cart_id (${cartId}). El plugin no podrá encontrar el pago.`,
        payment_external_reference: payment.external_reference,
        cart_id: cartId,
      });
    }
    
    logger.info(`[PaymentSessionUpdate] ✅ El external_reference coincide con el cart_id. El plugin podrá encontrar el pago.`);
    
    // CRÍTICO: Autorizar explícitamente la sesión de pago
    // El plugin de MercadoPago necesita que la sesión esté autorizada ANTES de cart.complete()
    // Si la sesión está en 'pending', cart.complete() fallará con "Payment sessions are required to complete cart"
    logger.info(`[PaymentSessionUpdate] Paso 6: Autorizando sesión de pago...`);
    logger.info(`[PaymentSessionUpdate] Estado actual de la sesión: ${paymentSession.status}`);
    
    let authorizedSession;
    try {
      // Preparar los datos para autorizar la sesión
      // El plugin de MercadoPago buscará el pago usando el external_reference (cart_id)
      const authorizeData = {
        data: {
          // El plugin usa 'session_id' como external_reference para buscar el pago en MercadoPago
          session_id: payment.external_reference || cartId,
          payment_id: payment.id.toString(),
          payment_status: payment.status,
          payment_status_detail: payment.status_detail,
          external_reference: payment.external_reference,
          transaction_amount: payment.transaction_amount,
        },
      };
      
      logger.info(`[PaymentSessionUpdate] Datos para autorizar sesión: ${JSON.stringify({
        session_id: authorizeData.data.session_id,
        payment_id: authorizeData.data.payment_id,
        payment_status: authorizeData.data.payment_status,
        external_reference: authorizeData.data.external_reference,
      })}`);
      
      logger.info(`[PaymentSessionUpdate] Llamando a paymentModuleService.authorizePaymentSession...`);
      authorizedSession = await paymentModuleService.authorizePaymentSession(
        paymentSessionId,
        authorizeData
      );
      
      logger.info(`[PaymentSessionUpdate] ✅ authorizePaymentSession completado`);
      logger.info(`[PaymentSessionUpdate] Respuesta de authorizePaymentSession:`);
      logger.info(`[PaymentSessionUpdate]   - status: ${authorizedSession?.status || 'unknown'}`);
      logger.info(`[PaymentSessionUpdate]   - id: ${authorizedSession?.id || 'unknown'}`);
      logger.info(`[PaymentSessionUpdate]   - amount: ${authorizedSession?.amount || 'unknown'}`);
      logger.info(`[PaymentSessionUpdate] Respuesta completa (stringified): ${JSON.stringify({
        status: authorizedSession?.status,
        id: authorizedSession?.id,
        provider_id: authorizedSession?.provider_id,
        amount: authorizedSession?.amount,
        authorized_at: authorizedSession?.authorized_at,
      }, null, 2)}`);
      
      // Verificar que la sesión fue autorizada correctamente
      const finalSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);
      logger.info(`[PaymentSessionUpdate] Estado final de la sesión (después de retrieve): ${finalSession?.status}`);
      logger.info(`[PaymentSessionUpdate] Detalles completos de la sesión autorizada:`);
      logger.info(`[PaymentSessionUpdate]   - id: ${finalSession?.id}`);
      logger.info(`[PaymentSessionUpdate]   - provider_id: ${finalSession?.provider_id}`);
      logger.info(`[PaymentSessionUpdate]   - status: ${finalSession?.status}`);
      logger.info(`[PaymentSessionUpdate]   - amount: ${finalSession?.amount}`);
      logger.info(`[PaymentSessionUpdate]   - authorized_at: ${finalSession?.authorized_at || 'null'}`);
      logger.info(`[PaymentSessionUpdate]   - data keys: ${finalSession?.data ? Object.keys(finalSession.data).join(', ') : 'null'}`);
      
      if (finalSession?.status !== 'authorized' && finalSession?.status !== 'captured') {
        logger.error(`[PaymentSessionUpdate] ❌ ERROR: La sesión NO fue autorizada. Estado: ${finalSession?.status}`);
        logger.error(`[PaymentSessionUpdate] Esto causará que cart.complete() falle.`);
        logger.warn(`[PaymentSessionUpdate] ⚠️ El plugin podría intentar autorizar durante cart.complete() usando external_reference=${payment.external_reference}`);
      } else {
        logger.info(`[PaymentSessionUpdate] ✅✅✅ Sesión autorizada correctamente. Estado: ${finalSession?.status}`);
        logger.info(`[PaymentSessionUpdate] ✅ La sesión está lista para que cart.complete() la procese correctamente.`);
      }
    } catch (authError: any) {
      logger.error(`[PaymentSessionUpdate] ❌ Error al autorizar sesión de pago: ${authError.message}`, authError);
      logger.error(`[PaymentSessionUpdate] Stack: ${authError.stack}`);
      logger.error(`[PaymentSessionUpdate] Esto puede causar que cart.complete() falle.`);
      
      // Continuar de todas formas, pero registrar el error
      // El plugin podría intentar autorizar durante cart.complete()
    }
    
    // Obtener el estado final de la sesión para la respuesta
    const finalSessionStatus = await paymentModuleService.retrievePaymentSession(paymentSessionId)
      .then(s => s?.status)
      .catch(() => paymentSession.status);
    
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
        status: finalSessionStatus,
      },
      message: finalSessionStatus === 'authorized' || finalSessionStatus === 'captured'
        ? "Payment verified and session authorized successfully."
        : "Payment verified. Session authorization may be pending.",
    };
    
    logger.info(`[PaymentSessionUpdate] ========== FIN DE ACTUALIZACIÓN DE SESIÓN (ÉXITO) ==========`);
    logger.info(`[PaymentSessionUpdate] ✅ Estado final de la sesión: ${finalSessionStatus}`);
    logger.info(`[PaymentSessionUpdate] ✅ El plugin debería poder completar el carrito ahora.`);
    
    return res.json(response);
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

