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

            const cart = carts?.[0] as any;
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

              // Obtener el monto del carrito para pasarlo en authorizeData
              const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
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
              
              const cartAmount = cartData?.[0]?.payment_collection?.amount || payment.transaction_amount;
              logger.info(`[Webhook] Monto del carrito para autorización: ${cartAmount}`);

              // Si la sesión no está autorizada, intentar autorizarla
              if (paymentSession.status !== "authorized" && paymentSession.status !== "captured") {
                logger.info(`[Webhook] Autorizando sesión de pago ${paymentSession.id}...`);
                const authorizeResult = await paymentModuleService.authorizePaymentSession(
                  paymentSession.id,
                  {
                    amount: cartAmount, // CRÍTICO: Pasar el amount para actualizar payment_collection.authorized_amount
                    data: {
                      session_id: payment.external_reference, // Pasar el cart_id como session_id para que el plugin lo encuentre
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
                  
                  // SOLUCIÓN COMPLETA: Intentar completar el carrito automáticamente
                  // Esperar un poco para que la base de datos se sincronice
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  logger.info(`[Webhook] Intentando completar el carrito ${payment.external_reference}...`);
                  
                  // Función auxiliar para intentar completar el carrito con reintentos
                  const attemptCartCompletion = async (retries = 3): Promise<boolean> => {
                    for (let attempt = 1; attempt <= retries; attempt++) {
                      try {
                        logger.info(`[Webhook] Intento ${attempt}/${retries} de completar carrito...`);
                        
                        // Verificar que el carrito esté listo para completarse
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
                          filters: {
                            id: payment.external_reference,
                          },
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
                        
                        logger.info(`[Webhook] Carrito verificado (intento ${attempt}): ${JSON.stringify({
                          id: cartToComplete.id,
                          hasEmail: !!cartToComplete.email,
                          hasShippingAddress: !!cartToComplete.shipping_address,
                          hasBillingAddress: !!cartToComplete.billing_address,
                          hasShippingMethods: !!cartToComplete.shipping_methods?.length,
                          paymentCollectionStatus: cartToComplete.payment_collection?.status,
                          authorizedAmount: cartToComplete.payment_collection?.authorized_amount,
                          amount: cartToComplete.payment_collection?.amount,
                        })}`);
                        
                        // Verificar que el carrito esté completo antes de intentar completarlo
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
                          const storeApiUrl = `${medusaBackendUrl}/store/carts/${payment.external_reference}/complete`;
                          
                          logger.info(`[Webhook] URL del Store API: ${storeApiUrl}`);
                          
                          const completeResponse = await fetch(storeApiUrl, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                          });
                          
                          if (completeResponse.ok) {
                            const completeData = await completeResponse.json();
                            logger.info(`[Webhook] ✅✅✅ Carrito completado exitosamente desde webhook!`);
                            logger.info(`[Webhook] Respuesta: ${JSON.stringify({
                              type: completeData.type,
                              orderId: completeData.order?.id,
                              orderDisplayId: completeData.order?.display_id,
                            })}`);
                            return true;
                          } else {
                            const errorText = await completeResponse.text().catch(() => '');
                            logger.warn(`[Webhook] ⚠️ Error al completar carrito desde webhook (intento ${attempt}): ${completeResponse.status} - ${errorText}`);
                            if (attempt < retries) {
                              await new Promise(resolve => setTimeout(resolve, 1000));
                              continue;
                            }
                          }
                        } else {
                          logger.warn(`[Webhook] ⚠️ Carrito no está listo para completarse (intento ${attempt}). Faltan datos requeridos.`);
                          if (attempt < retries) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            continue;
                          }
                        }
                      } catch (completeError: any) {
                        logger.error(`[Webhook] ❌ Error al intentar completar carrito desde webhook (intento ${attempt}): ${completeError.message}`);
                        logger.error(`[Webhook] Stack: ${completeError.stack}`);
                        if (attempt < retries) {
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          continue;
                        }
                      }
                    }
                    return false;
                  };
                  
                  // Intentar completar el carrito
                  const completed = await attemptCartCompletion(3);
                  if (!completed) {
                    logger.warn(`[Webhook] ⚠️ No se pudo completar el carrito desde el webhook después de 3 intentos.`);
                    logger.warn(`[Webhook] La página de éxito intentará completar el carrito cuando el usuario llegue`);
                  }
                } else {
                  logger.warn(`[Webhook] ⚠️ Sesión de pago ${paymentSession.id} no autorizada por webhook. Estado: ${finalSession?.status}`);
                }
              } else {
                logger.info(`[Webhook] Sesión de pago ${paymentSession.id} ya está ${paymentSession.status}. No se requiere autorización.`);
                
                // Si ya está autorizada, intentar completar el carrito también
                if (paymentSession.status === "authorized" || paymentSession.status === "captured") {
                  logger.info(`[Webhook] Sesión ya autorizada, intentando completar carrito...`);
                  
                  // Usar la misma lógica de reintentos
                  const attemptCartCompletion = async (retries = 3): Promise<boolean> => {
                    for (let attempt = 1; attempt <= retries; attempt++) {
                      try {
                        logger.info(`[Webhook] Intento ${attempt}/${retries} de completar carrito (sesión ya autorizada)...`);
                        
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
                          filters: {
                            id: payment.external_reference,
                          },
                        });
                        
                        const cartToComplete = cartCheck?.[0];
                        if (
                          cartToComplete?.email &&
                          cartToComplete?.shipping_address &&
                          cartToComplete?.billing_address &&
                          cartToComplete?.shipping_methods?.length > 0 &&
                          cartToComplete?.payment_collection?.authorized_amount &&
                          cartToComplete.payment_collection.authorized_amount > 0
                        ) {
                          const medusaBackendUrl = process.env.MEDUSA_BACKEND_URL || process.env.APP_URL || 'http://localhost:9000';
                          const storeApiUrl = `${medusaBackendUrl}/store/carts/${payment.external_reference}/complete`;
                          
                          const completeResponse = await fetch(storeApiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                          });
                          
                          if (completeResponse.ok) {
                            const completeData = await completeResponse.json();
                            logger.info(`[Webhook] ✅✅✅ Carrito completado exitosamente (sesión ya autorizada)!`);
                            logger.info(`[Webhook] Order ID: ${completeData.order?.id}, Display ID: ${completeData.order?.display_id}`);
                            return true;
                          } else {
                            const errorText = await completeResponse.text().catch(() => '');
                            logger.warn(`[Webhook] ⚠️ Error al completar carrito (intento ${attempt}): ${completeResponse.status} - ${errorText}`);
                            if (attempt < retries) {
                              await new Promise(resolve => setTimeout(resolve, 1000));
                              continue;
                            }
                          }
                        } else {
                          logger.warn(`[Webhook] ⚠️ Carrito no está listo (intento ${attempt}).`);
                          if (attempt < retries) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            continue;
                          }
                        }
                      } catch (error: any) {
                        logger.warn(`[Webhook] ⚠️ Error al completar carrito (intento ${attempt}): ${error.message}`);
                        if (attempt < retries) {
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          continue;
                        }
                      }
                    }
                    return false;
                  };
                  
                  const completed = await attemptCartCompletion(3);
                  if (!completed) {
                    logger.warn(`[Webhook] ⚠️ No se pudo completar el carrito (sesión ya autorizada) después de 3 intentos.`);
                    logger.warn(`[Webhook] La página de éxito intentará completar el carrito cuando el usuario llegue`);
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

