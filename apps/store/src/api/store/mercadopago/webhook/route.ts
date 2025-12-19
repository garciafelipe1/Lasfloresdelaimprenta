import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { MercadoPagoWebhookSchemaType } from "./validators";

/**
 * Webhook de MercadoPago para recibir notificaciones de pagos
 * 
 * Este endpoint recibe notificaciones de MercadoPago sobre cambios
 * en el estado de los pagos y actualiza el estado en Medusa.
 * 
 * TIPOS DE NOTIFICACIONES:
 * - payment: Cuando se crea, aprueba o rechaza un pago
 * - merchant_order: Cuando cambia el estado de una orden
 * 
 * SEGURIDAD:
 * - Validar el webhook secret de MercadoPago
 * - Verificar la firma de la notificación
 */
export async function POST(
  req: MedusaRequest<MercadoPagoWebhookSchemaType>,
  res: MedusaResponse
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!webhookSecret || !accessToken) {
    logger.error("MercadoPago webhook secret or access token not configured");
    return res.status(500).json({
      error: "Webhook configuration error",
    });
  }

  try {
    const { type, data, action } = req.validatedBody;

    logger.info(`Received MercadoPago webhook: type=${type}, action=${action}, id=${data.id}`);

    // Validar el webhook secret si está presente en los headers
    const xSignature = req.headers["x-signature"] as string;
    const xRequestId = req.headers["x-request-id"] as string;

    if (xSignature && webhookSecret) {
      // Aquí deberías validar la firma del webhook
      // Por ahora, confiamos en que viene de MercadoPago si tiene el header
      logger.info(`Webhook signature received: ${xSignature.substring(0, 20)}...`);
    }

    // Inicializar cliente de MercadoPago
    const mercadoPagoClient = new MercadoPagoConfig({
      accessToken,
    });

    // Manejar diferentes tipos de notificaciones
    if (type === "payment") {
      const paymentId = data.id;

      // Obtener información del pago desde MercadoPago
      const payment = await new Payment(mercadoPagoClient).get({
        id: paymentId,
      });

      logger.info(
        `[Webhook] Payment ${paymentId} status: ${payment.status}, status_detail: ${payment.status_detail}, external_reference: ${payment.external_reference}`
      );

      // Si el pago fue aprobado, intentar autorizar la sesión de pago
      if (payment.status === "approved") {
        logger.info(
          `[Webhook] ✅ Payment ${paymentId} approved. Status detail: ${payment.status_detail}, external_reference (cart_id): ${payment.external_reference}`
        );

        // CRÍTICO: El external_reference debe ser el cart_id para que podamos encontrar la sesión de pago
        if (payment.external_reference) {
          logger.info(
            `[Webhook] Payment ${paymentId} is associated with cart ${payment.external_reference}.`
          );
          
          try {
            // Buscar la sesión de pago asociada al carrito usando query module
            // El plugin de MercadoPago busca el pago usando el external_reference (cart_id)
            logger.info(`[Webhook] Buscando sesión de pago para carrito ${payment.external_reference}...`);
            
            const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
            const { data: carts } = await query.graph({
              entity: "cart",
              fields: [
                "payment_collection.payment_sessions.id",
                "payment_collection.payment_sessions.provider_id",
                "payment_collection.payment_sessions.status",
              ],
              filters: {
                id: payment.external_reference,
              },
            });

            const cart = carts?.[0];
            const paymentSessions = cart?.payment_collection?.payment_sessions?.filter(
              (session: any) => session.provider_id === "pp_mercadopago_mercadopago"
            ) || [];

            if (paymentSessions.length > 0) {
              const paymentSession = paymentSessions[0];
              logger.info(`[Webhook] Sesión de pago encontrada: ${paymentSession.id}, estado actual: ${paymentSession.status}`);

              // Validar que payment.id existe antes de usarlo
              if (!payment.id) {
                logger.error(`[Webhook] ❌ Payment ID no está definido. No se puede autorizar la sesión.`);
                throw new Error("Payment ID is undefined");
              }

              // Si la sesión no está autorizada, intentar autorizarla
              if (paymentSession.status !== "authorized" && paymentSession.status !== "captured") {
                logger.info(`[Webhook] Autorizando sesión de pago ${paymentSession.id}...`);
                const authorizeResult = await paymentModuleService.authorizePaymentSession(
                  paymentSession.id,
                  {
                    data: {
                      session_id: payment.external_reference, // Pasar el cart_id como session_id para que el plugin lo encuentre
                      payment_id: payment.id.toString(),
                      payment_status: payment.status,
                      external_reference: payment.external_reference,
                      transaction_amount: payment.transaction_amount,
                    },
                  }
                );
                logger.info(`[Webhook] Resultado de autorización: ${JSON.stringify(authorizeResult, null, 2)}`);
                const finalSession = await paymentModuleService.retrievePaymentSession(paymentSession.id);
                logger.info(`[Webhook] Estado final de la sesión después de webhook: ${finalSession?.status}`);

                if (finalSession?.status === "authorized" || finalSession?.status === "captured") {
                  logger.info(`[Webhook] ✅ Sesión de pago ${paymentSession.id} autorizada exitosamente por webhook.`);
                } else {
                  logger.warn(`[Webhook] ⚠️ Sesión de pago ${paymentSession.id} no autorizada por webhook. Estado: ${finalSession?.status}`);
                }
              } else {
                logger.info(`[Webhook] Sesión de pago ${paymentSession.id} ya está ${paymentSession.status}. No se requiere autorización.`);
              }
            } else {
              logger.warn(`[Webhook] ⚠️ No se encontró sesión de pago para cart_id: ${payment.external_reference}`);
            }
          } catch (error: any) {
            logger.error(`[Webhook] Error al procesar pago aprobado: ${error.message}`, error);
            logger.error(`[Webhook] Stack: ${error.stack}`);
          }
        } else {
          logger.warn(`[Webhook] Payment ${paymentId} approved but has no external_reference (cart_id)`);
        }
      } else if (payment.status === "rejected") {
        logger.warn(
          `[Webhook] Payment ${paymentId} rejected. Reason: ${payment.status_detail}`
        );
      } else if (payment.status === "pending") {
        logger.info(`[Webhook] Payment ${paymentId} is pending`);
      } else {
        logger.info(
          `[Webhook] Payment ${paymentId} status: ${payment.status}, detail: ${payment.status_detail}`
        );
      }
    } else if (type === "merchant_order") {
      logger.info(`Merchant order notification received: ${data.id}`);
      // Manejar notificaciones de órdenes si es necesario
    } else {
      logger.info(`Unhandled webhook type: ${type}`);
    }

    // Responder a MercadoPago que recibimos la notificación
    return res.status(200).json({
      received: true,
      type,
      id: data.id,
    });
  } catch (error: any) {
    logger.error(`Error processing MercadoPago webhook: ${error.message}`, error);

    // Aún así respondemos 200 para que MercadoPago no reintente
    // (pero deberías loguear el error para investigarlo)
    return res.status(200).json({
      received: true,
      error: error.message,
    });
  }
}

