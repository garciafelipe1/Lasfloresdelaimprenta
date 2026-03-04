import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { MercadoPagoWebhookSchemaType } from "./validators";

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

    logger.info(`[Webhook] ========== WEBHOOK RECIBIDO ==========`);
    logger.info(`[Webhook] Timestamp: ${new Date().toISOString()}`);
    logger.info(`[Webhook] type=${type}, action=${action}, id=${data.id}`);
    logger.info(`[Webhook] Body completo: ${JSON.stringify(req.validatedBody, null, 2)}`);

    const xSignature = req.headers["x-signature"] as string;
    if (xSignature && webhookSecret) {
      logger.info(`Webhook signature received: ${xSignature.substring(0, 20)}...`);
    }

    const mercadoPagoClient = new MercadoPagoConfig({
      accessToken,
    });

    if (type === "payment") {
      const paymentId = data.id;

      const payment = await new Payment(mercadoPagoClient).get({
        id: paymentId,
      });

      logger.info(
        `[Webhook] Payment ${paymentId} status: ${payment.status}, status_detail: ${payment.status_detail}, external_reference: ${payment.external_reference}`
      );

      if (payment.status === "approved") {
        logger.info(
          `[Webhook] ✅ Payment ${paymentId} approved. Status detail: ${payment.status_detail}, external_reference (cart_id): ${payment.external_reference}`
        );

        if (payment.external_reference) {
          logger.info(
            `[Webhook] Payment ${paymentId} is associated with cart ${payment.external_reference}.`
          );
          
          try {
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

            const cart = carts?.[0] as any;
            const paymentSessions = cart?.payment_collection?.payment_sessions?.filter(
              (session: any) => session.provider_id === "pp_mercadopago_mercadopago"
            ) || [];

            if (paymentSessions.length > 0) {
              const paymentSession = paymentSessions[0];
              logger.info(`[Webhook] Sesión de pago encontrada: ${paymentSession.id}, estado actual: ${paymentSession.status}`);

              if (!payment.id) {
                logger.error(`[Webhook] ❌ Payment ID no está definido. No se puede autorizar la sesión.`);
                throw new Error("Payment ID is undefined");
              }

              const { data: cartData } = await query.graph({
                entity: "cart",
                fields: [
                  "id",
                  "payment_collection.amount",
                ],
                filters: {
                  id: payment.external_reference,
                },
              });
              
              const cartFromDB = cartData?.[0];
              const cartAmount = cartFromDB?.payment_collection?.amount;
              
              if (!cartAmount || cartAmount <= 0) {
                logger.error(`[Webhook] ❌ ERROR: No se pudo obtener el monto del carrito. payment_collection.amount: ${cartAmount}`);
                throw new Error(`No se pudo obtener el monto del carrito para autorización. Cart ID: ${payment.external_reference}`);
              }
              
              logger.info(`[Webhook] Monto del carrito para autorización: ${cartAmount}`);
              
              if (payment.transaction_amount && Math.abs(cartAmount - payment.transaction_amount) > 0.01) {
                logger.warn(`[Webhook] ⚠️ ADVERTENCIA: Discrepancia entre monto del carrito (${cartAmount}) y transaction_amount de MercadoPago (${payment.transaction_amount})`);
              }

              if (paymentSession.status !== "authorized" && paymentSession.status !== "captured") {
                logger.info(`[Webhook] Autorizando sesión de pago ${paymentSession.id}...`);
                const authorizeResult = await paymentModuleService.authorizePaymentSession(
                  paymentSession.id,
                  {
                    amount: cartAmount,
                    data: {
                      session_id: payment.external_reference,
                      payment_id: payment.id.toString(),
                      payment_status: payment.status,
                      payment_status_detail: payment.status_detail,
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
                  
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  logger.info(`[Webhook] Intentando completar el carrito ${payment.external_reference}...`);
                  
                  const completed = await attemptCartCompletion(query, logger, payment.external_reference!, 3);
                  if (!completed) {
                    logger.warn(`[Webhook] ⚠️ No se pudo completar el carrito desde el webhook después de 3 intentos.`);
                  }
                } else {
                  logger.warn(`[Webhook] ⚠️ Sesión de pago ${paymentSession.id} no autorizada por webhook. Estado: ${finalSession?.status}`);
                }
              } else {
                logger.info(`[Webhook] Sesión de pago ${paymentSession.id} ya está ${paymentSession.status}. No se requiere autorización.`);
                
                if (paymentSession.status === "authorized" || paymentSession.status === "captured") {
                  logger.info(`[Webhook] Sesión ya autorizada, intentando completar carrito...`);
                  const completed = await attemptCartCompletion(query, logger, payment.external_reference!, 3);
                  if (!completed) {
                    logger.warn(`[Webhook] ⚠️ No se pudo completar el carrito (sesión ya autorizada) después de 3 intentos.`);
                  }
                }
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
    } else {
      logger.info(`Unhandled webhook type: ${type}`);
    }

    return res.status(200).json({
      received: true,
      type,
      id: data.id,
    });
  } catch (error: any) {
    logger.error(`Error processing MercadoPago webhook: ${error.message}`, error);

    return res.status(200).json({
      received: true,
      error: error.message,
    });
  }
}

async function attemptCartCompletion(
  query: any,
  logger: any,
  cartId: string,
  retries: number
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`[Webhook] Intento ${attempt}/${retries} de completar carrito...`);
      
      const { data: cartCheck } = await query.graph({
        entity: "cart",
        fields: [
          "id",
          "email",
          "shipping_address.id",
          "billing_address.id",
          "shipping_methods.id",
          "payment_collection.id",
          "payment_collection.status",
          "payment_collection.authorized_amount",
          "payment_collection.amount",
        ],
        filters: { id: cartId },
      });
      
      const cartToComplete = cartCheck?.[0];
      if (!cartToComplete) {
        logger.warn(`[Webhook] ⚠️ No se encontró el carrito en el intento ${attempt}`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return false;
      }
      
      if (
        cartToComplete.email &&
        cartToComplete.shipping_address &&
        cartToComplete.billing_address &&
        cartToComplete.shipping_methods?.length > 0 &&
        cartToComplete.payment_collection?.authorized_amount &&
        cartToComplete.payment_collection.authorized_amount > 0
      ) {
        logger.info(`[Webhook] ✅ Carrito listo para completarse. Llamando a Store API...`);
        
        const medusaBackendUrl = process.env.MEDUSA_BACKEND_URL || process.env.APP_URL || 'http://localhost:9000';
        const storeApiUrl = `${medusaBackendUrl}/store/carts/${cartId}/complete`;
        
        const completeResponse = await fetch(storeApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (completeResponse.ok) {
          const completeData = await completeResponse.json();
          logger.info(`[Webhook] ✅✅✅ Carrito completado exitosamente desde webhook!`);
          logger.info(`[Webhook] Order ID: ${completeData.order?.id}, Display ID: ${completeData.order?.display_id}`);
          return true;
        } else {
          const errorText = await completeResponse.text().catch(() => '');
          logger.warn(`[Webhook] ⚠️ Error al completar carrito (intento ${attempt}): ${completeResponse.status} - ${errorText}`);
        }
      } else {
        logger.warn(`[Webhook] ⚠️ Carrito no está listo para completarse (intento ${attempt}).`);
      }
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      logger.error(`[Webhook] ❌ Error al completar carrito (intento ${attempt}): ${error.message}`);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  return false;
}
