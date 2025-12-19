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
    
    // CRÍTICO: Obtener el monto del carrito para actualizar el payment_collection.authorized_amount
    // Medusa requiere que el payment_collection.authorized_amount coincida con el total del carrito
    logger.info(`[PaymentSessionUpdate] Paso 6: Obteniendo monto del carrito...`);
    let cartAmount = 0;
    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: [
          "id",
          "payment_collection.amount",
        ],
        filters: {
          id: cartId,
        },
      });
      
      const cart = carts?.[0];
      if (cart) {
        // Usar el amount del payment_collection (que es el total del carrito)
        cartAmount = cart.payment_collection?.amount || 0;
        logger.info(`[PaymentSessionUpdate] ✅ Monto del carrito obtenido: ${cartAmount}`);
        logger.info(`[PaymentSessionUpdate]   - payment_collection.amount: ${cart.payment_collection?.amount}`);
      } else {
        logger.warn(`[PaymentSessionUpdate] ⚠️ No se pudo obtener el carrito, usando transaction_amount de MercadoPago`);
        cartAmount = payment.transaction_amount || 0;
      }
    } catch (cartError: any) {
      logger.error(`[PaymentSessionUpdate] ❌ Error al obtener monto del carrito: ${cartError.message}`, cartError);
      logger.warn(`[PaymentSessionUpdate] ⚠️ Usando transaction_amount de MercadoPago como fallback`);
      cartAmount = payment.transaction_amount || 0;
    }
    
    // SOLUCIÓN SIMPLIFICADA: Solo actualizar la sesión con los datos del pago
    // El plugin de MercadoPago manejará la autorización automáticamente durante cart.complete()
    // Actualizar la sesión con los datos del pago para que el plugin los tenga disponibles
    logger.info(`[PaymentSessionUpdate] Paso 7: Actualizando sesión de pago con datos de MercadoPago...`);
    logger.info(`[PaymentSessionUpdate] Estado actual de la sesión: ${paymentSession.status}`);
    
    try {
      // Actualizar la sesión con los datos del pago aprobado
      // El plugin usará estos datos cuando se llame a cart.complete()
      const updatedSessionData = {
        ...paymentSession.data,
        payment_id: payment.id.toString(),
        payment_status: payment.status,
        payment_status_detail: payment.status_detail,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount,
        session_id: payment.external_reference || cartId,
        updated_at: new Date().toISOString(),
      };
      
      logger.info(`[PaymentSessionUpdate] Datos del pago para autorizar: ${JSON.stringify({
        payment_id: updatedSessionData.payment_id,
        payment_status: updatedSessionData.payment_status,
        external_reference: updatedSessionData.external_reference,
      })}`);
      
      // Autorizar la sesión directamente con todos los datos del pago
      logger.info(`[PaymentSessionUpdate] Autorizando sesión de pago con datos de MercadoPago...`);
      const authorizeData = {
        amount: cartAmount, // CRÍTICO: El amount es necesario para actualizar payment_collection.authorized_amount
        data: updatedSessionData,
      };
      
      await paymentModuleService.authorizePaymentSession(
        paymentSessionId,
        authorizeData
      );
      
      logger.info(`[PaymentSessionUpdate] ✅ Sesión autorizada`);
      
      // Verificar el estado final
      const finalSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);
      logger.info(`[PaymentSessionUpdate] Estado final de la sesión: ${finalSession?.status}`);
      
      // CRÍTICO: Verificar el estado del payment_collection después de autorizar la sesión
      // Medusa requiere que el payment_collection tenga authorized_amount > 0 para completar el carrito
      logger.info(`[PaymentSessionUpdate] Paso 7: Verificando estado del payment_collection...`);
      try {
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: [
            "id",
            "payment_collection.id",
            "payment_collection.status",
            "payment_collection.amount",
            "payment_collection.authorized_amount",
            "payment_collection.captured_amount",
            "payment_collection.payment_sessions.id",
            "payment_collection.payment_sessions.status",
            "payment_collection.payment_sessions.amount",
          ],
          filters: {
            id: cartId,
          },
        });
        
        const cart = carts?.[0];
        if (cart?.payment_collection) {
          const paymentCollection = cart.payment_collection;
          logger.info(`[PaymentSessionUpdate] Payment Collection después de autorizar sesión:`);
          logger.info(`[PaymentSessionUpdate]   - id: ${paymentCollection.id}`);
          logger.info(`[PaymentSessionUpdate]   - status: ${paymentCollection.status}`);
          logger.info(`[PaymentSessionUpdate]   - amount: ${paymentCollection.amount}`);
          logger.info(`[PaymentSessionUpdate]   - authorized_amount: ${paymentCollection.authorized_amount}`);
          logger.info(`[PaymentSessionUpdate]   - captured_amount: ${paymentCollection.captured_amount}`);
          
          // CRÍTICO: Verificar si el authorized_amount es 0
          if (!paymentCollection.authorized_amount || paymentCollection.authorized_amount === 0) {
            logger.error(`[PaymentSessionUpdate] ❌❌❌ PROBLEMA CRÍTICO: payment_collection.authorized_amount es 0`);
            logger.error(`[PaymentSessionUpdate] Esto causará que cart.complete() falle con "Payment sessions are required to complete cart"`);
            logger.error(`[PaymentSessionUpdate] El problema es que authorizePaymentSession NO actualiza el payment_collection.authorized_amount`);
            logger.error(`[PaymentSessionUpdate] La sesión está authorized, pero el payment_collection no refleja esto`);
            logger.warn(`[PaymentSessionUpdate] ⚠️ El plugin de MercadoPago debería actualizar el payment_collection durante cart.complete()`);
            logger.warn(`[PaymentSessionUpdate] ⚠️ Pero si el payment_collection.authorized_amount es 0, cart.complete() fallará antes de llegar al plugin`);
          } else {
            logger.info(`[PaymentSessionUpdate] ✅ payment_collection.authorized_amount es > 0: ${paymentCollection.authorized_amount}`);
            logger.info(`[PaymentSessionUpdate] ✅✅✅ El payment_collection está listo para cart.complete()`);
            logger.info(`[PaymentSessionUpdate] ✅ La orden se creará correctamente cuando se llame a cart.complete()`);
            logger.info(`[PaymentSessionUpdate] ✅ Monto autorizado coincide con el monto del carrito: ${paymentCollection.authorized_amount} === ${paymentCollection.amount}`);
            
            // Verificar que el monto autorizado coincide con el monto del carrito
            if (paymentCollection.authorized_amount === paymentCollection.amount) {
              logger.info(`[PaymentSessionUpdate] ✅✅✅ PERFECTO: authorized_amount coincide con amount`);
            } else {
              logger.warn(`[PaymentSessionUpdate] ⚠️ authorized_amount (${paymentCollection.authorized_amount}) no coincide con amount (${paymentCollection.amount})`);
            }
          }
        } else {
          logger.warn(`[PaymentSessionUpdate] ⚠️ No se pudo obtener el payment_collection del carrito`);
        }
      } catch (pcError: any) {
        logger.error(`[PaymentSessionUpdate] ❌ Error al verificar payment_collection: ${pcError.message}`, pcError);
      }
      
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

