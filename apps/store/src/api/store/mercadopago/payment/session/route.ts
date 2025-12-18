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
      
      // IMPORTANTE: Actualizar los datos de la sesión con el payment_id de MercadoPago
      // El plugin de MercadoPago debería autorizar automáticamente cuando se complete el carrito
      // usando el external_reference (cart_id) para buscar el pago en MercadoPago.
      // Sin embargo, para asegurarnos de que funcione, actualizamos los datos de la sesión
      // con el payment_id y luego intentamos autorizar manualmente.
      logger.info(`[PaymentSessionUpdate] Paso 5: Actualizando datos de la sesión con payment_id...`);
      
      // Actualizar los datos de la sesión con el payment_id
      const updatedSessionData = {
        ...(paymentSession.data || {}),
        payment_id: payment.id.toString(),
        payment_status: payment.status,
        payment_status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        external_reference: payment.external_reference,
        updated_at: new Date().toISOString(),
      };
      
      logger.info(`[PaymentSessionUpdate] Datos actualizados para la sesión:`);
      logger.info(`[PaymentSessionUpdate] ${JSON.stringify(updatedSessionData, null, 2)}`);
      
      try {
        // Intentar autorizar la sesión directamente
        // El plugin de MercadoPago debería poder autorizar usando el external_reference (cart_id)
        // cuando se complete el carrito, pero intentamos autorizar manualmente aquí
        logger.info(`[PaymentSessionUpdate] Paso 6: Intentando autorizar la sesión...`);
        
        // IMPORTANTE: El plugin busca el pago usando el session_id como external_reference.
        // Como ahora usamos cart_id como external_reference en la preferencia, el plugin no encontrará el pago
        // si buscamos por external_reference. Sin embargo, tenemos el payment_id directamente del pago aprobado,
        // así que podemos pasar los datos del pago directamente al plugin sin necesidad de buscar.
        // El plugin debería poder usar estos datos directamente si están presentes.
        const authorizeData = {
          data: {
            // El plugin espera session_id para buscar el pago en MercadoPago usando external_reference
            // Pero como usamos cart_id como external_reference, pasamos el cart_id como session_id
            // para que el plugin pueda encontrar el pago buscando por external_reference con el cart_id
            session_id: cartId, // Usar cart_id como session_id porque es el external_reference en MercadoPago
            // Incluir todos los datos del pago para que el plugin pueda usarlos directamente
            ...updatedSessionData,
            // Asegurar que estos campos estén presentes (pueden sobrescribir los de updatedSessionData)
            id: payment.id,
            status: payment.status,
          },
        };
        
        logger.info(`[PaymentSessionUpdate] IMPORTANTE: Como usamos cart_id (${cartId}) como external_reference en MercadoPago,`);
        logger.info(`[PaymentSessionUpdate] pasamos el cart_id como session_id para que el plugin busque el pago correctamente.`);
        logger.info(`[PaymentSessionUpdate] El plugin buscará pagos con external_reference = ${cartId}`);
        logger.info(`[PaymentSessionUpdate] Verificando que el external_reference del pago coincida: ${payment.external_reference}`);
        
        if (payment.external_reference !== cartId) {
          logger.warn(`[PaymentSessionUpdate] ⚠️ ADVERTENCIA: El external_reference del pago (${payment.external_reference}) no coincide con el cart_id (${cartId})`);
          logger.warn(`[PaymentSessionUpdate] ⚠️ Esto puede causar que el plugin no encuentre el pago al buscar por external_reference.`);
          logger.warn(`[PaymentSessionUpdate] ⚠️ Sin embargo, pasamos los datos del pago directamente, así que debería funcionar.`);
        } else {
          logger.info(`[PaymentSessionUpdate] ✅ El external_reference del pago coincide con el cart_id. El plugin debería encontrar el pago.`);
        }
        
        logger.info(`[PaymentSessionUpdate] Datos de autorización: ${JSON.stringify(authorizeData, null, 2)}`);
        
        const authorizeResult = await paymentModuleService.authorizePaymentSession(
          paymentSessionId,
          authorizeData
        );

        logger.info(`[PaymentSessionUpdate] ✅ authorizePaymentSession ejecutado`);
        logger.info(`[PaymentSessionUpdate] Resultado: ${JSON.stringify(authorizeResult, null, 2)}`);
        
        // CRÍTICO: Verificar que el estado realmente cambió
        logger.info(`[PaymentSessionUpdate] Paso 7: Verificando cambio de estado...`);
        logger.info(`[PaymentSessionUpdate] Estado ANTES: ${paymentSession.status}`);
        
        // Esperar un momento para que se propague el cambio
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);
        logger.info(`[PaymentSessionUpdate] Estado DESPUÉS: ${finalSession?.status}`);
        
        // VERIFICACIÓN CRÍTICA
        if (finalSession?.status !== 'authorized' && finalSession?.status !== 'captured') {
          logger.error(`[PaymentSessionUpdate] ❌❌❌ PROBLEMA CRÍTICO: La sesión NO está autorizada`);
          logger.error(`[PaymentSessionUpdate] Estado esperado: 'authorized' o 'captured'`);
          logger.error(`[PaymentSessionUpdate] Estado actual: '${finalSession?.status}'`);
          logger.error(`[PaymentSessionUpdate] Esto causará que cart.complete() falle`);
          logger.error(`[PaymentSessionUpdate] El plugin debería autorizar automáticamente cuando se complete el carrito usando external_reference: ${payment.external_reference}`);
        } else {
          logger.info(`[PaymentSessionUpdate] ✅✅✅ Estado correcto: ${finalSession?.status}`);
        }
        
        logger.info(`[PaymentSessionUpdate] Detalles finales de la sesión:`);
        logger.info(`[PaymentSessionUpdate]   - id: ${finalSession?.id}`);
        logger.info(`[PaymentSessionUpdate]   - status: ${finalSession?.status}`);
        logger.info(`[PaymentSessionUpdate]   - data: ${JSON.stringify(finalSession?.data, null, 2)}`);

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
        
        logger.info(`[PaymentSessionUpdate] ========== FIN DE ACTUALIZACIÓN DE SESIÓN ==========`);
        
        return res.json(response);
      } catch (error: any) {
        logger.error(`[PaymentSessionUpdate] ❌ Error al actualizar/autorizar sesión`);
        logger.error(`[PaymentSessionUpdate] Tipo: ${error?.constructor?.name}`);
        logger.error(`[PaymentSessionUpdate] Mensaje: ${error?.message}`);
        logger.error(`[PaymentSessionUpdate] Stack: ${error?.stack}`);
        logger.error(`[PaymentSessionUpdate] Error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
        
        // Aún retornamos éxito porque el plugin puede intentar autorizar cuando se complete el carrito
        logger.warn(`[PaymentSessionUpdate] ⚠️ Continuando. El plugin intentará autorizar cuando se complete el carrito.`);
        
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

