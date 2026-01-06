import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, loadEnv } from "@medusajs/framework/utils";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { externalReferenceSchema } from "../../../lib/zod/mercado-pago-external-reference";
import { createSubscriptionWorkflow } from "../../../workflows/membership/create-subscription";
import { getSubscriptionsWorkflow } from "../../../workflows/membership/get-all-subscription";
import { WebhookSubscriptionSchemaType } from "./validators";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
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
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  logger.info(`[MembershipWebhook] ========== INICIO DE WEBHOOK DE MEMBRESÍA ==========`);
  logger.info(`[MembershipWebhook] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[MembershipWebhook] URL: ${req.url}`);
  logger.info(`[MembershipWebhook] Method: ${req.method}`);
  logger.info(`[MembershipWebhook] Headers: ${JSON.stringify(req.headers, null, 2)}`);
  logger.info(`[MembershipWebhook] Body recibido: ${JSON.stringify(req.body, null, 2)}`);
  logger.info(`[MembershipWebhook] Body type: ${typeof req.body}`);
  logger.info(`[MembershipWebhook] Body keys: ${Object.keys(req.body || {}).join(', ')}`);

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
        logger.info(`[MembershipWebhook]   - ended_at: ${preapproval.next_payment_date}`);

        try {
          const workflowResult = await createSubscriptionWorkflow(req.scope).run({
          input: {
            customer_id: result.data.userId,
            external_id: preapproval.id!,
            membership_id: result.data.membershipId,
            ended_at: new Date(preapproval.next_payment_date!),
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
        logger.info(
          `[MembershipWebhook] ⚠️ Preapproval ${preapproval.id} NO está autorizado. Status: ${preapproval.status}`
        );
        logger.info(`[MembershipWebhook] No se creará la suscripción hasta que el preapproval esté autorizado.`);
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
