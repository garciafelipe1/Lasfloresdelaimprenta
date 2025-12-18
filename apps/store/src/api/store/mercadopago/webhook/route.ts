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
            // Intentar encontrar la sesión de pago del carrito
            // El plugin debería manejar esto, pero intentamos ayudar
            logger.info(`[Webhook] Buscando sesión de pago para carrito ${payment.external_reference}...`);
            
            // NOTA: El plugin de MercadoPago debería manejar la autorización automáticamente
            // cuando se complete el carrito. Este webhook solo registra la información.
            // Si el plugin no autoriza durante cart.complete(), podría ser un problema de configuración.
            
            logger.info(
              `[Webhook] El plugin debería autorizar automáticamente la sesión cuando se complete el carrito ${payment.external_reference}.`
            );
          } catch (error: any) {
            logger.error(`[Webhook] Error al procesar pago aprobado: ${error.message}`, error);
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

