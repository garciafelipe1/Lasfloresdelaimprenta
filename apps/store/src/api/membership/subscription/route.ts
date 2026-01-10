import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, loadEnv } from "@medusajs/framework/utils";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { externalReferenceSchema } from "../../../lib/zod/mercado-pago-external-reference";
import { MEMBERSHIP_MODULE } from "../../../modules/membership";
import MembershipModuleService from "../../../modules/membership/service";
import { createSubscriptionWorkflow } from "../../../workflows/membership/create-subscription";
import { getSubscriptionsWorkflow } from "../../../workflows/membership/get-all-subscription";
import { WebhookSubscriptionSchemaType } from "./validators";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// Handler para peticiones OPTIONS (CORS preflight)
export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  return res.status(200).end();
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger");
  
  // Agregar headers CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // Si hay un query parameter 'preapproval_id', verificar y crear suscripción si es necesario
  const preapprovalId = req.query.preapproval_id as string | undefined;
  
  if (preapprovalId) {
    logger.info(`[MembershipSubscription] Verificando PreApproval ${preapprovalId}...`);
    
    try {
      const preapproval = await new PreApproval(mercadoPagoClient).get({
        id: preapprovalId,
      });
      
      logger.info(`[MembershipSubscription] PreApproval obtenido: status=${preapproval.status}`);
      
      // Si el PreApproval está autorizado, verificar si ya existe la suscripción
      if (preapproval.status === "authorized" && preapproval.external_reference) {
        let externalReferenceData;
        try {
          externalReferenceData = JSON.parse(preapproval.external_reference);
          const result = externalReferenceSchema.safeParse(externalReferenceData);
          
          if (result.success) {
            logger.info(`[MembershipSubscription] External reference válido. Verificando si la suscripción ya existe...`);
            
            // Verificar si ya existe una suscripción con este external_id
            const membershipModuleService: MembershipModuleService = req.scope.resolve(MEMBERSHIP_MODULE);
            const allSubscriptions = await membershipModuleService.listSubscriptions();
            const existingSubscription = allSubscriptions.find(
              (sub: any) => sub.external_id === preapprovalId
            );
            
            if (!existingSubscription) {
              logger.info(`[MembershipSubscription] No existe suscripción. Creando suscripción...`);
              
              // Asegurar que next_payment_date sea un objeto Date válido
              let endedAt: Date;
              if (preapproval.next_payment_date) {
                const nextPaymentDate = new Date(preapproval.next_payment_date);
                if (isNaN(nextPaymentDate.getTime())) {
                  logger.warn(`[MembershipSubscription] next_payment_date no es válido: ${preapproval.next_payment_date}. Usando fecha de 1 mes desde ahora.`);
                  endedAt = new Date();
                  endedAt.setMonth(endedAt.getMonth() + 1);
                } else {
                  endedAt = nextPaymentDate;
                }
              } else {
                logger.warn(`[MembershipSubscription] next_payment_date no está disponible. Usando fecha de 1 mes desde ahora.`);
                endedAt = new Date();
                endedAt.setMonth(endedAt.getMonth() + 1);
              }
              
              logger.info(`[MembershipSubscription] ended_at calculado: ${endedAt.toISOString()}`);
              
              try {
                const workflowResult = await createSubscriptionWorkflow(req.scope).run({
                  input: {
                    customer_id: result.data.userId,
                    external_id: preapprovalId,
                    membership_id: result.data.membershipId,
                    ended_at: endedAt,
                  },
                });
                
                logger.info(`[MembershipSubscription] ✅ Suscripción creada exitosamente`);
                return res.json({
                  success: true,
                  message: "Subscription created successfully",
                  subscription: workflowResult.result,
                });
              } catch (workflowError: any) {
                logger.error(`[MembershipSubscription] ❌ Error al ejecutar workflow: ${workflowError.message}`);
                logger.error(`[MembershipSubscription] Stack: ${workflowError.stack}`);
                return res.status(500).json({
                  success: false,
                  error: "Failed to create subscription",
                  message: workflowError.message,
                });
              }
            } else {
              logger.info(`[MembershipSubscription] ✅ Suscripción ya existe`);
              return res.json({
                success: true,
                message: "Subscription already exists",
                subscription: existingSubscription,
              });
            }
          } else {
            logger.error(`[MembershipSubscription] ❌ External reference inválido: ${JSON.stringify(result.error.errors)}`);
            return res.status(400).json({
              success: false,
              error: "Invalid external reference",
              message: "External reference doesn't have enough information",
              details: result.error.errors,
            });
          }
        } catch (parseError: any) {
          logger.error(`[MembershipSubscription] ❌ Error al parsear external_reference: ${parseError.message}`);
          logger.error(`[MembershipSubscription] Stack: ${parseError.stack}`);
          return res.status(400).json({
            success: false,
            error: "Invalid external reference format",
            message: parseError.message,
          });
        }
      } else {
        logger.info(`[MembershipSubscription] PreApproval no está autorizado. Status: ${preapproval.status}`);
        return res.json({
          success: false,
          message: `PreApproval status is ${preapproval.status}, not authorized yet`,
          status: preapproval.status,
        });
      }
    } catch (error: any) {
      logger.error(`[MembershipSubscription] Error al verificar PreApproval: ${error.message}`);
      return res.status(500).json({
        error: "Failed to verify PreApproval",
        message: error.message,
      });
    }
  }
  
  // Si no hay preapproval_id, devolver todas las suscripciones (comportamiento original)
  const { result: subscriptions } = await getSubscriptionsWorkflow(
    req.scope
  ).run();

  res.json(subscriptions);
}

export async function POST(
  req: MedusaRequest<WebhookSubscriptionSchemaType>,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  
  // Agregar headers CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  logger.info(`[MembershipWebhook] ========== INICIO DE WEBHOOK DE MEMBRESÍA ==========`);
  logger.info(`[MembershipWebhook] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[MembershipWebhook] URL: ${req.url}`);
  logger.info(`[MembershipWebhook] Method: ${req.method}`);
  logger.info(`[MembershipWebhook] Headers recibidos: ${JSON.stringify(req.headers, null, 2)}`);
  logger.info(`[MembershipWebhook] Body recibido (raw): ${JSON.stringify(req.body, null, 2)}`);
  logger.info(`[MembershipWebhook] Body type: ${typeof req.body}`);
  logger.info(`[MembershipWebhook] Body keys: ${Object.keys(req.body || {}).join(', ')}`);
  logger.info(`[MembershipWebhook] req.validatedBody disponible: ${!!req.validatedBody}`);
  logger.info(`[MembershipWebhook] req.validatedBody: ${JSON.stringify(req.validatedBody, null, 2)}`);

  // Validar webhook secret si está configurado
  if (webhookSecret) {
    const xSignature = req.headers["x-signature"] as string;
    const xRequestId = req.headers["x-request-id"] as string;

    if (!xSignature) {
      logger.warn("[MembershipWebhook] Webhook received without signature header");
      // En producción, podrías rechazar el webhook si no tiene firma
      // return res.status(401).json({ error: "Missing signature" });
    } else {
      logger.info(`[MembershipWebhook] Webhook signature received: ${xSignature.substring(0, 20)}...`);
      // Aquí deberías validar la firma del webhook comparándola con webhookSecret
      // Por ahora, confiamos en que viene de MercadoPago si tiene el header
    }
  }

  try {
    // Verificar que req.validatedBody existe
    if (!req.validatedBody) {
      logger.error(`[MembershipWebhook] ❌ req.validatedBody no está disponible. El middleware de validación podría haber fallado.`);
      logger.error(`[MembershipWebhook] Body raw: ${JSON.stringify(req.body, null, 2)}`);
      return res.status(400).json({
        error: "Invalid webhook body",
        message: "The webhook body could not be validated",
      });
    }

    const { type, data, action } = req.validatedBody;
    
    logger.info(`[MembershipWebhook] Webhook recibido: type=${type}, action=${action}, id=${data.id}`);

    if (type === "subscription_preapproval") {
      logger.info(`[MembershipWebhook] ✅ Tipo de webhook correcto: subscription_preapproval`);
      logger.info(`[MembershipWebhook] Procesando webhook de suscripción (preapproval)...`);
      logger.info(`[MembershipWebhook] ID del preapproval: ${data.id}`);
      logger.info(`[MembershipWebhook] Action: ${action}`);
      
      logger.info(`[MembershipWebhook] Obteniendo PreApproval de MercadoPago...`);
    const preapproval = await new PreApproval(mercadoPagoClient).get({
      id: req.validatedBody.data.id,
    });

      logger.info(`[MembershipWebhook] ✅ Preapproval obtenido de MercadoPago:`);
      logger.info(`[MembershipWebhook]   - id: ${preapproval.id}`);
      logger.info(`[MembershipWebhook]   - status: ${preapproval.status}`);
      logger.info(`[MembershipWebhook]   - external_reference: ${preapproval.external_reference}`);
      logger.info(`[MembershipWebhook]   - next_payment_date: ${preapproval.next_payment_date}`);
      logger.info(`[MembershipWebhook]   - payer_email: ${preapproval.payer_email}`);
      logger.info(`[MembershipWebhook]   - reason: ${preapproval.reason}`);
      logger.info(`[MembershipWebhook] Preapproval completo: ${JSON.stringify(preapproval, null, 2)}`);

      // Verificar el status del PreApproval
      logger.info(`[MembershipWebhook] 🔍 Verificando status del PreApproval: ${preapproval.status}`);
      logger.info(`[MembershipWebhook] Status es 'authorized'? ${preapproval.status === "authorized"}`);
      logger.info(`[MembershipWebhook] Status es 'pending'? ${preapproval.status === "pending"}`);
      logger.info(`[MembershipWebhook] Status es 'cancelled'? ${preapproval.status === "cancelled"}`);

    // Si se aprueba, actualizamos el usuario con el id de la suscripción
    if (preapproval.status === "authorized") {
        logger.info(`[MembershipWebhook] ✅ Preapproval ${preapproval.id} está autorizado. Creando suscripción...`);
        
        let externalReferenceData;
        try {
          externalReferenceData = JSON.parse(preapproval.external_reference!);
          logger.info(`[MembershipWebhook] External reference parseado: ${JSON.stringify(externalReferenceData)}`);
        } catch (parseError: any) {
          logger.error(`[MembershipWebhook] ❌ Error al parsear external_reference: ${parseError.message}`);
          logger.error(`[MembershipWebhook] External reference raw: ${preapproval.external_reference}`);
          return res.status(400).json({
            error: "Invalid external reference format",
            message: parseError.message,
          });
        }
        
        const result = externalReferenceSchema.safeParse(externalReferenceData);

      if (!result.success) {
          logger.error(
            `[MembershipWebhook] ❌ Invalid external reference structure: ${JSON.stringify(result.error.errors)}`
          );
          logger.error(`[MembershipWebhook] External reference recibido: ${JSON.stringify(externalReferenceData)}`);
          return res.status(400).json({
            error: "External reference doesnt have enough information",
            details: result.error.errors,
          });
      }

        logger.info(`[MembershipWebhook] Datos para crear suscripción:`);
        logger.info(`[MembershipWebhook]   - customer_id (userId): ${result.data.userId}`);
        logger.info(`[MembershipWebhook]   - membership_id: ${result.data.membershipId}`);
        logger.info(`[MembershipWebhook]   - external_id (preapproval.id): ${preapproval.id}`);
        logger.info(`[MembershipWebhook]   - next_payment_date (raw): ${preapproval.next_payment_date}`);
        
        // Asegurar que next_payment_date sea un objeto Date válido
        let endedAt: Date;
        if (preapproval.next_payment_date) {
          const nextPaymentDate = new Date(preapproval.next_payment_date);
          if (isNaN(nextPaymentDate.getTime())) {
            logger.warn(`[MembershipWebhook] next_payment_date no es válido: ${preapproval.next_payment_date}. Usando fecha de 1 mes desde ahora.`);
            endedAt = new Date();
            endedAt.setMonth(endedAt.getMonth() + 1);
          } else {
            endedAt = nextPaymentDate;
          }
        } else {
          logger.warn(`[MembershipWebhook] next_payment_date no está disponible. Usando fecha de 1 mes desde ahora.`);
          endedAt = new Date();
          endedAt.setMonth(endedAt.getMonth() + 1);
      }
        
        logger.info(`[MembershipWebhook]   - ended_at calculado: ${endedAt.toISOString()}`);

      try {
          const workflowResult = await createSubscriptionWorkflow(req.scope).run({
          input: {
            customer_id: result.data.userId,
            external_id: preapproval.id!,
            membership_id: result.data.membershipId,
            ended_at: endedAt,
          },
        });

          logger.info(
            `[MembershipWebhook] ✅✅✅ Suscripción creada exitosamente para customer ${result.data.userId}`
          );
          logger.info(`[MembershipWebhook] Resultado del workflow: ${JSON.stringify(workflowResult, null, 2)}`);
        } catch (error: any) {
          logger.error(`[MembershipWebhook] ❌ Error al crear suscripción: ${error.message}`, error);
          logger.error(`[MembershipWebhook] Stack: ${error.stack}`);
          logger.error(`[MembershipWebhook] Error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
          return res.status(500).json({
            error: "Failed to create subscription",
            message: error.message,
          });
        }
      } else {
        logger.warn(
          `[MembershipWebhook] ⚠️ Preapproval ${preapproval.id} NO está autorizado. Status: ${preapproval.status}`
        );
        logger.warn(`[MembershipWebhook] No se creará la suscripción hasta que el preapproval esté autorizado.`);
        logger.warn(`[MembershipWebhook] Action recibida: ${action}`);
        logger.warn(`[MembershipWebhook] Tipos de action esperados: 'authorized', 'updated', 'created'`);
        logger.warn(`[MembershipWebhook] Si el PreApproval está en 'pending', MercadoPago enviará otro webhook cuando cambie a 'authorized'.`);
        logger.warn(`[MembershipWebhook] Si el PreApproval está en 'authorized' pero no se creó la suscripción, verifica los logs anteriores.`);
        
        // Responder 200 para que MercadoPago no reintente, pero loguear el warning
        return res.status(200).json({
          received: true,
          message: `PreApproval status is ${preapproval.status}, not authorized yet`,
        });
      }
    } else {
      logger.info(`[MembershipWebhook] ⚠️ Tipo de webhook no manejado: ${type}`);
      logger.info(`[MembershipWebhook] Tipos esperados: subscription_preapproval`);
    }

    logger.info(`[MembershipWebhook] ========== FIN DE WEBHOOK DE MEMBRESÍA (ÉXITO) ==========`);
    return res.json({ received: true });
  } catch (error: any) {
    logger.error(`[MembershipWebhook] ❌ Error procesando webhook de suscripción: ${error.message}`, error);
    logger.error(`[MembershipWebhook] Stack: ${error.stack}`);
    logger.error(`[MembershipWebhook] Error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
    logger.info(`[MembershipWebhook] ========== FIN DE WEBHOOK DE MEMBRESÍA (ERROR) ==========`);
    
    // Aún respondemos 200 para que MercadoPago no reintente, pero logueamos el error
    return res.status(200).json({
      received: true,
      error: error.message,
    });
  }
}
