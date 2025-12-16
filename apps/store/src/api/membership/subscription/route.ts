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

  // Validar webhook secret si está configurado
  if (webhookSecret) {
    const xSignature = req.headers["x-signature"] as string;
    const xRequestId = req.headers["x-request-id"] as string;

    if (!xSignature) {
      logger.warn("Webhook received without signature header");
      // En producción, podrías rechazar el webhook si no tiene firma
      // return res.status(401).json({ error: "Missing signature" });
    } else {
      logger.info(`Webhook signature received: ${xSignature.substring(0, 20)}...`);
      // Aquí deberías validar la firma del webhook comparándola con webhookSecret
      // Por ahora, confiamos en que viene de MercadoPago si tiene el header
    }
  }

  try {
    if (req.validatedBody.type === "subscription_preapproval") {
      const preapproval = await new PreApproval(mercadoPagoClient).get({
        id: req.validatedBody.data.id,
      });

      logger.info(
        `Subscription preapproval ${preapproval.id} status: ${preapproval.status}`
      );

      // Si se aprueba, actualizamos el usuario con el id de la suscripción
      if (preapproval.status === "authorized") {
        const result = externalReferenceSchema.safeParse(
          JSON.parse(preapproval.external_reference!)
        );

        if (!result.success) {
          logger.error(
            `Invalid external reference: ${preapproval.external_reference}`
          );
          return res.status(400).json({
            error: "External reference doesnt have enough information",
          });
        }

        try {
          await createSubscriptionWorkflow(req.scope).run({
            input: {
              customer_id: result.data.userId,
              external_id: preapproval.id!,
              membership_id: result.data.membershipId,
              ended_at: new Date(preapproval.next_payment_date!),
            },
          });

          logger.info(
            `Subscription created successfully for customer ${result.data.userId}`
          );
        } catch (error: any) {
          logger.error(`Error creating subscription: ${error.message}`, error);
          return res.status(500).json({
            error: "Failed to create subscription",
            message: error.message,
          });
        }
      } else {
        logger.info(
          `Preapproval ${preapproval.id} not authorized. Status: ${preapproval.status}`
        );
      }
    } else {
      logger.info(`Unhandled webhook type: ${req.validatedBody.type}`);
    }

    return res.json({ received: true });
  } catch (error: any) {
    logger.error(`Error processing subscription webhook: ${error.message}`, error);
    return res.status(500).json({
      error: "Failed to process webhook",
      message: error.message,
    });
  }
}
