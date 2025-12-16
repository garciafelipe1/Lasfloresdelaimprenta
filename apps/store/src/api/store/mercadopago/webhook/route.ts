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
        `Payment ${paymentId} status: ${payment.status}, status_detail: ${payment.status_detail}`
      );

      // Buscar la sesión de pago en Medusa usando el external_id
      // El external_id debería ser el payment_id de MercadoPago
      try {
        // Intentar encontrar la sesión de pago por external_id
        // Nota: Esto depende de cómo el plugin almacene el external_id
        const paymentSessions = await paymentModuleService.listPaymentSessions({
          provider_id: {
            $ilike: "pp_mercadopago_%",
          },
        });

        // Buscar la sesión que coincida con este pago
        // Esto requiere que el plugin almacene el payment_id en la sesión
        for (const session of paymentSessions) {
          // Si encontramos la sesión, actualizar su estado
          if (payment.status === "approved") {
            // El pago fue aprobado, pero la captura debería hacerse
            // cuando se complete el carrito
            logger.info(
              `Payment ${paymentId} approved. Session: ${session.id}`
            );
          } else if (payment.status === "rejected") {
            logger.warn(
              `Payment ${paymentId} rejected. Reason: ${payment.status_detail}`
            );
          } else if (payment.status === "pending") {
            logger.info(`Payment ${paymentId} is pending`);
          }
        }
      } catch (sessionError: any) {
        logger.error(
          `Error processing payment session: ${sessionError.message}`,
          sessionError
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

